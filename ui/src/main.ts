import "./styles.css";
import { tolgee } from "./i18n/tolgee.ts";

await tolgee.run();

import("./ui/app.ts");
