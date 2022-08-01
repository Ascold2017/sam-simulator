import "vuetify/styles"; // Global CSS has to be imported
import { createApp } from "vue";
import App from "./App.vue";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
(window as any).__ACCELERATION__ = 1;
const vuetify = createVuetify({
  components,
  theme: {
    defaultTheme: "dark",
  },
});
const app = createApp(App);
app.use(vuetify);
app.mount("#app");
