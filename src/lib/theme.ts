export const THEME_KEY = "theme";

/** Inline script that runs before first paint so the page never flashes the wrong theme. */
export const themeScript = `try{var p=localStorage.getItem("${THEME_KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}`;
