// src/main.js
import { createApp } from "vue";
import { createVuetify } from "vuetify";

// Vuetify styles
import "vuetify/styles";
// Material Design Icons (nodig voor knoppen/icons)
import "@mdi/font/css/materialdesignicons.css";

// Vuetify plugin voor Vue
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import App from "./App.vue";

const vuetify = createVuetify({
  components,
  directives,
});

createApp(App).use(vuetify).mount("#app");
