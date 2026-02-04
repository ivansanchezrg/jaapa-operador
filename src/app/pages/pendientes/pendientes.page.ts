import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSpinner,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonRefresher,
  IonRefresherContent,
  IonFooter,
  ToastController,
  RefresherEventDetail,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  checkmarkCircle,
  timeOutline,
  cloudOfflineOutline,
  cloudDoneOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { DatabaseService, NetworkService, SyncService } from '../../core/services';
import { Lectura } from '../../core/interfaces';

@Component({
  selector: 'app-pendientes',
  templateUrl: './pendientes.page.html',
  styleUrls: ['./pendientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonSpinner,
    IonIcon,
    IonBadge,
    IonList,
    IonItem,
    IonRefresher,
    IonRefresherContent,
    IonFooter,
  ],
})
export class PendientesPage implements OnInit, OnDestroy {
  private databaseService = inject(DatabaseService);
  private networkService = inject(NetworkService);
  private syncService = inject(SyncService);
  private toastController = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  lecturas: Lectura[] = [];
  isOnline = true;
  isSyncing = false;
  isLoading = true;

  private subscriptions = new Subscription();

  constructor() {
    addIcons({
      cloudUploadOutline,
      checkmarkCircle,
      timeOutline,
      cloudOfflineOutline,
      cloudDoneOutline
    });
  }

  async ngOnInit(): Promise<void> {
    this.subscriptions.add(
      this.networkService.online$.subscribe(online => {
        this.isOnline = online;
      })
    );

    await this.cargarLecturas();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async cargarLecturas(): Promise<void> {
    this.isLoading = true;
    try {
      this.lecturas = await this.databaseService.obtenerTodasLasLecturas();
    } catch (error) {
      console.error('Error cargando lecturas:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async doRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
    await this.cargarLecturas();
    (event.target as HTMLIonRefresherElement).complete();
  }

  async sincronizarTodas(): Promise<void> {
    if (!this.isOnline) {
      await this.mostrarToast('Sin conexion a internet', 'warning');
      return;
    }

    const pendientes = this.lecturas.filter(l => !l.sincronizado);
    if (pendientes.length === 0) {
      await this.mostrarToast('No hay lecturas pendientes', 'medium');
      return;
    }

    this.isSyncing = true;

    try {
      const result = await this.syncService.sincronizarTodas();

      if (result.sincronizadas > 0) {
        await this.mostrarToast(
          `${result.sincronizadas} lectura(s) sincronizada(s)`,
          'success'
        );
      }

      if (result.fallidas > 0) {
        await this.mostrarToast(
          `${result.fallidas} lectura(s) fallaron`,
          'warning'
        );
      }

      await this.cargarLecturas();
    } catch (error: any) {
      await this.mostrarToast('Error al sincronizar', 'danger');
    } finally {
      this.isSyncing = false;
      this.cdr.detectChanges();
    }
  }

  get pendientesCount(): number {
    return this.lecturas.filter(l => !l.sincronizado).length;
  }

  get sincronizadasCount(): number {
    return this.lecturas.filter(l => l.sincronizado).length;
  }

  formatFecha(fechaHora: string): string {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private async mostrarToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
