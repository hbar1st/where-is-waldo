import "./styles.css";
import { landingPage } from "./landingPage.js";


landingPage(document, API_URL); // this value is replaced at runtime by webpack (the real value is in the webpack config files)