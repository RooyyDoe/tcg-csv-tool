<template>
  <v-app>
    <v-container class="py-8" max-width="800">
      <v-card elevation="3" class="pa-5">
        <v-card-title class="text-h5 mb-4"
          >📦 TCG PowerTools CSV Generator</v-card-title
        >

        <v-file-input
          label="Upload je catalog.csv"
          accept=".csv"
          prepend-icon="mdi-upload"
          @change="loadCatalog"
        ></v-file-input>

        <v-autocomplete
          v-model="selectedExpansion"
          :items="expansions"
          label="Selecteer set"
          class="mt-4"
          :disabled="!catalog.length"
        ></v-autocomplete>

        <v-row class="mt-2">
          <v-col cols="6">
            <v-text-field
              v-model="collectorNumber"
              label="Collector number"
              clearable
              @keyup.enter="handleAddCard"
              ref="collectorNumberRef"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="quantity"
              label="Aantal"
              type="number"
              min="1"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="6">
            <v-select
              v-model="selectedCondition"
              :items="['MT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO']"
              label="Selecteer conditie"
            ></v-select>
          </v-col>
          <v-col cols="6">
            <v-select
              v-model="selectedLanguage"
              :items="[
                'English',
                'French',
                'German',
                'Spanish',
                'Italian',
                'Portuguese',
              ]"
              label="Selecteer taal"
            ></v-select>
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="6">
            <v-switch v-model="isFoil" color="primary" label="isFoil" />
          </v-col>
          <v-col cols="6">
            <v-switch v-model="isHolo" color="primary" label="HOLO" />
          </v-col>
        </v-row>

        <v-btn
          color="primary"
          @click="handleAddCard"
          :disabled="!selectedExpansion || !collectorNumber"
        >
          Voeg kaart toe
        </v-btn>

        <v-divider class="my-6"></v-divider>

        <v-data-table
          :headers="headers"
          :items="selectionFlat"
          class="elevation-1"
          density="comfortable"
          v-if="selectionFlat.length"
        >
          <template v-slot:item.actions="{ item }">
            <v-icon
              color="error"
              size="small"
              @click="deleteCard(item.expansionCode, item.collectorNumber)"
              title="Verwijder kaart"
            >
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>

        <div class="mt-6">
          <v-btn
            color="secondary"
            class="mr-2"
            @click="downloadJson"
            :disabled="!selection.length"
          >
            Download JSON
          </v-btn>
          <v-btn
            color="success"
            @click="generateCsv"
            :disabled="!selection.length || !catalog.length"
          >
            Genereer CSV
          </v-btn>
        </div>
      </v-card>
    </v-container>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import Papa from "papaparse";

const catalog = ref([]);
const expansions = ref([]);
const selectedExpansion = ref("");
const selectedLanguage = ref("English");
const selectedCondition = ref("NM");
const collectorNumber = ref("");
const quantity = ref(1);
const selection = reactive([]);
const isFoil = ref(false);
const isHolo = ref(false);
const collectorNumberRef = ref(null);

const headers = [
  { title: "Set", key: "expansionCode" },
  { title: "Collector #", key: "collectorNumber" },
  { title: "Aantal", key: "quantity" },
  { title: "Conditie", key: "condition" },
  { title: "Taal", key: "language" },
  { title: "isFoil", key: "isFoil" },
  { title: "Acties", key: "actions", sortable: false },
];

function deleteCard(expansionCode, collectorNumber) {
  const setIndex = selection.findIndex(
    (s) => s.expansionCode === expansionCode
  );
  if (setIndex === -1) return;

  const set = selection[setIndex];
  const cardIndex = set.cards.findIndex(
    (c) => c.collectorNumber === collectorNumber
  );
  if (cardIndex === -1) return;

  set.cards.splice(cardIndex, 1);

  // Remove the set if it's empty
  if (set.cards.length === 0) {
    selection.splice(setIndex, 1);
  }
}

const selectionFlat = computed(() =>
  selection.flatMap((set) =>
    set.cards.map((c) => ({
      expansionCode: set.expansionCode,
      collectorNumber: c.collectorNumber,
      quantity: c.quantity,
      condition: c.condition,
      language: c.language,
      isFoil: c.isFoil,
    }))
  )
);

// Helper function to normalize collector numbers
function normalizeCollectorNumber(num) {
  // Remove leading zeros and convert to string
  return String(parseInt(num, 10));
}

function loadCatalog(event) {
  const file = event.srcElement.files?.[0];

  if (!file) return;
  Papa.parse(file, {
    header: true,
    complete: (res) => {
      catalog.value = res.data.filter((r) => r.expansionCode);
      expansions.value = [
        ...new Set(catalog.value.map((c) => c.expansionCode)),
      ].sort();
      alert(`Catalog geladen met ${catalog.value.length} kaarten.`);
    },
  });
}

function addCard() {
  if (!selectedExpansion.value || !collectorNumber.value) return;
  let set = selection.find((s) => s.expansionCode === selectedExpansion.value);
  if (!set) {
    set = { expansionCode: selectedExpansion.value, cards: [] };
    selection.push(set);
  }

  // Check for existing card with same properties
  const existingCard = set.cards.find(
    (c) =>
      normalizeCollectorNumber(c.collectorNumber) ===
        normalizeCollectorNumber(collectorNumber.value) &&
      c.condition === selectedCondition.value &&
      c.language === selectedLanguage.value &&
      c.isFoil === isFoil.value &&
      c.comment === (isHolo.value ? "HOLO" : undefined)
  );

  if (existingCard) {
    // If card exists, increase quantity
    existingCard.quantity += quantity.value;
  } else {
    // If card doesn't exist, add new card
    set.cards.push({
      collectorNumber: collectorNumber.value,
      quantity: quantity.value,
      condition: selectedCondition.value,
      language: selectedLanguage.value,
      isFoil: isFoil.value,
      comment: isHolo.value ? "HOLO" : undefined,
    });
  }

  collectorNumber.value = "";
  quantity.value = 1;
  selectedCondition.value = "NM";
  selectedLanguage.value = "English";
  isFoil.value = false;
  isHolo.value = false;
}

function handleAddCard() {
  addCard();

  if (collectorNumberRef.value) {
    collectorNumberRef.value.focus();
  }
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(selection, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "selection.json";
  a.click();
}

function generateCsv() {
  const output = [];
  selection.forEach((set) => {
    set.cards.forEach((card) => {
      const match = catalog.value.find(
        (c) =>
          c.expansionCode === set.expansionCode &&
          normalizeCollectorNumber(c.collectorNumber) ===
            normalizeCollectorNumber(card.collectorNumber)
      );

      if (match) {
        output.push({
          cardmarketId: match.cardmarketId,
          collectorNumber: match.collectorNumber,
          name: match.name,
          expansion: match.expansion,
          rarity: match.rarity,
          language: card.language,
          condition: card.condition,
          price: 0.1,
          quantity: card.quantity,
          isFoil: card.isFoil,
          comment: card.comment,
        });
      }
    });
  });

  const csv = Papa.unparse(output);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "powerTools_upload.csv";
  a.click();
}
</script>

<style scoped>
.v-container {
  max-width: 800px;
}
</style>
