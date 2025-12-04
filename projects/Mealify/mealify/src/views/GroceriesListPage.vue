<template>
  <ion-page>
    <!-- HEADER met titel en toevoeg-knop -->
    <ion-header>
      <ion-toolbar>
        <ion-title>Liste de courses</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openToevoegModal">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  </ion-page>

</template>

<script setup>
import { IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButton,
  IonButtons, 
  IonIcon,
  // IonContent,
  // IonCard,
 } from '@ionic/vue';
</script>
