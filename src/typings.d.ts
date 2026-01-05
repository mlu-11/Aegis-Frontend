declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.css" {
  const url: string;
  export default url;
}
declare module "*.scss" {
  const url: string;
  export default url;
}
declare module "*.sass" {
  const url: string;
  export default url;
}
declare module "*.styl" {
  const url: string;
  export default url;
}
