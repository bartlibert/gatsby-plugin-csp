const React = require("react");
const flatten = require("lodash.flatten");

const {
  computeHash,
  cspString,
  getHashes,
  defaultDirectives,
  saveNginxConf
} = require("./utils");

exports.onPreRenderHTML = (
  {
    pathname,
    getHeadComponents,
    replaceHeadComponents,
    getPreBodyComponents,
    getPostBodyComponents
  },
  userPluginOptions
) => {
  const {
    disableOnDev = true,
    reportOnly = false,
    reportUri = "",
    mergeScriptHashes = true,
    mergeStyleHashes = true,
    mergeDefaultDirectives = true,
    directives: userDirectives,
    useMetaTag = true,
    useNginxConf = true,
    nginxConfFile = ".cache/csp.conf"
  } = userPluginOptions;


  // early return if plugin is disabled on dev env
  if (process.env.NODE_ENV === "development" && disableOnDev) {
    return;
  }

  let components = [
    ...flatten(getHeadComponents()),
    ...flatten(getPostBodyComponents()),
    ...flatten(getPreBodyComponents())
  ];

  let directives = {
    ...(mergeDefaultDirectives && defaultDirectives),
    ...userDirectives
  };

  let csp = {
    ...directives,
    ...(mergeScriptHashes && {
      "script-src": `${directives["script-src"] || ""} ${getHashes(
        components,
        "script"
      )}`
    }),
    ...(mergeStyleHashes && {
      "style-src": `${directives["style-src"] || ""} ${getHashes(
        components,
        "style"
      )}`
    })
  };

  const headerName = reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy"


  if (useMetaTag) {
    const cspComponent = React.createElement("meta", {
      httpEquiv: headerName,
      content: cspString(csp)
    });

    let headComponentsWithCsp = [cspComponent, ...getHeadComponents()];

    replaceHeadComponents(headComponentsWithCsp);
  }

  if (useNginxConf) {
    saveNginxConf(nginxConfFile, pathname, headerName, cspString(csp));
  }

};
