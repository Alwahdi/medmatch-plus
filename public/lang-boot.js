try {
  var l = localStorage.getItem("syndeocare-lang");
  if (l === "en") {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }
} catch (e) {
  /* language preference unavailable; keep the Arabic default */
}
