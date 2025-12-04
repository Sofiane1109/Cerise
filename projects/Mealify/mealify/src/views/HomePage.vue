<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Menu de la semaine</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon slot="icon-only" :icon="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- En-tête de la semaine -->
      <div class="week-header">
        <ion-icon :icon="restaurantOutline" class="header-icon"></ion-icon>
        <h3>Semaine du 9 au 15 décembre 2024</h3>
      </div>

      <!-- Liste des jours -->
      <ion-list :inset="true" class="meals-list">
        <!-- Lundi -->
        <ion-item button class="meal-item">
          <div class="day-indicator filled" slot="start"></div>
          <ion-label>
            <h2>Lundi</h2>
            <p>Spaghetti bolognaise</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForward" class="arrow-icon"></ion-icon>
        </ion-item>

        <!-- Mardi -->
        <ion-item button class="meal-item">
          <div class="day-indicator filled" slot="start"></div>
          <ion-label>
            <h2>Mardi</h2>
            <p>Poulet rôti aux légumes</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForward" class="arrow-icon"></ion-icon>
        </ion-item>

        <!-- Mercredi -->
        <ion-item button class="meal-item">
          <div class="day-indicator empty" slot="start"></div>
          <ion-label>
            <h2>Mercredi</h2>
            <p class="no-meal">Aucun repas prévu</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForward" class="arrow-icon"></ion-icon>
        </ion-item>

        <!-- Jeudi -->
        <ion-item button class="meal-item">
          <div class="day-indicator filled" slot="start"></div>
          <ion-label>
            <h2>Jeudi</h2>
            <p>Lasagnes maison</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForward" class="arrow-icon"></ion-icon>
        </ion-item>

        <!-- Vendredi -->
        <ion-item button class="meal-item">
          <div class="day-indicator filled" slot="start"></div>
          <ion-label>
            <h2>Vendredi</h2>
            <p>Poisson grillé & riz</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForward" class="arrow-icon"></ion-icon>
        </ion-item>

        <!-- Samedi -->
        <ion-item button class="meal-item">
          <div class="day-indicator empty" slot="start"></div>
          <ion-label>
            <h2>Samedi</h2>
            <p class="no-meal">Aucun repas prévu</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForward" class="arrow-icon"></ion-icon>
        </ion-item>

        <!-- Dimanche -->
        <ion-item button class="meal-item">
          <div class="day-indicator filled" slot="start"></div>
          <ion-label>
            <h2>Dimanche</h2>
            <p>Rôti de bœuf</p>
          </ion-label>
          <ion-icon slot="end" :icon="chevronForward" class="arrow-icon"></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon
} from '@ionic/vue';
import { add, restaurantOutline, chevronForward } from 'ionicons/icons';
</script>

<style scoped>
/* En-tête de la semaine */
.week-header {
  padding: 28px 20px;
  text-align: center;
  background: #000000;
  border-bottom: 4px solid #F5E427;
}

.header-icon {
  font-size: 36px;
  color: #F5E427;
  margin-bottom: 10px;
  filter: drop-shadow(0 2px 8px rgba(245, 228, 39, 0.4));
}

.week-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

/* Liste */
.meals-list {
  margin: 20px 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Items */
.meal-item {
  --padding-start: 20px;
  --inner-padding-end: 16px;
  --min-height: 76px;
  --background: #FFFFFF;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.meal-item:active {
  --background: #FAFAFA;
  border-left-color: #F5E427;
}

ion-item h2 {
  font-weight: 700;
  font-size: 17px;
  color: #000000;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

ion-item p {
  font-size: 15px;
  color: #6B6B6B;
  font-weight: 400;
}

.no-meal {
  font-style: italic;
  opacity: 0.5;
  color: #9E9E9E !important;
}

/* Indicateur visuel du jour */
.day-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 16px;
  flex-shrink: 0;
}

.day-indicator.filled {
  background: #F5E427;
  box-shadow: 0 0 0 3px rgba(245, 228, 39, 0.2);
}

.day-indicator.empty {
  background: transparent;
  border: 2px solid #D0D0D0;
}

/* Flèche personnalisée */
.arrow-icon {
  color: #D0D0D0;
  font-size: 20px;
  transition: all 0.2s ease;
}

.meal-item:active .arrow-icon {
  color: #F5E427;
  transform: translateX(4px);
}

/* Animation au hover (desktop) */
@media (hover: hover) {
  .meal-item:hover {
    --background: #FAFAFA;
    border-left-color: #F5E427;
  }
  
  .meal-item:hover .arrow-icon {
    color: #F5E427;
    transform: translateX(4px);
  }
  
  .meal-item:hover .day-indicator.filled {
    transform: scale(1.15);
    box-shadow: 0 0 0 4px rgba(245, 228, 39, 0.3);
  }
}
</style>