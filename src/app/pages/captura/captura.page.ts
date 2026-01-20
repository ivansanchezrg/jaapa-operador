import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
  IonBadge,
  IonCard,
  IonCardContent,
  IonTextarea,
  IonFooter,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  checkmarkCircle,
  closeCircle,
  cloudOfflineOutline,
  cloudDoneOutline,
  listOutline,
  logOutOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import {
  AuthService,
  NetworkService,
  MedidoresService,
  SyncService,
  DatabaseService
} from '../../core/services';
import { Medidor } from '../../core/interfaces';

@Component({
  selector: 'app-captura',
  templateUrl: './captura.page.html',
  styleUrls: ['./captura.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon,
    IonBadge,
    IonCard,
    IonCardContent,
    IonTextarea,
    IonFooter,
  ],
})
export class CapturaPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private networkService = inject(NetworkService);
  private medidoresService = inject(MedidoresService);
  private syncService = inject(SyncService);
  private databaseService = inject(DatabaseService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  capturaForm: FormGroup;
  isOnline = true;
  isSearching = false;
  isSaving = false;
  medidorValido = false;
  medidorActual: Medidor | null = null;
  medidorError = '';
  pendientesCount = 0;

  private subscriptions = new Subscription();

  constructor() {
    addIcons({
      searchOutline,
      checkmarkCircle,
      closeCircle,
      cloudOfflineOutline,
      cloudDoneOutline,
      listOutline,
      logOutOutline
    });

    this.capturaForm = this.fb.group({
      codigoMedidor: ['', [Validators.required]],
      lectura: ['', [Validators.required, Validators.min(0)]],
      observacion: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    this.subscriptions.add(
      this.networkService.online$.subscribe(online => {
        this.isOnline = online;
      })
    );

    await this.actualizarContadorPendientes();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async buscarMedidor(): Promise<void> {
    const codigo = this.capturaForm.get('codigoMedidor')?.value?.trim();
    if (!codigo) return;

    this.isSearching = true;
    this.medidorValido = false;
    this.medidorActual = null;
    this.medidorError = '';

    try {
      const result = await this.medidoresService.buscarPorCodigo(codigo);

      if (result.medidor && result.medidor.estado === 'ACTIVO') {
        this.medidorActual = result.medidor;
        this.medidorValido = true;
      } else {
        this.medidorError = result.mensaje;
      }
    } catch (error: any) {
      this.medidorError = error?.message || 'Error al buscar medidor';
    } finally {
      this.isSearching = false;
    }
  }

  async guardarLectura(): Promise<void> {
    if (this.capturaForm.invalid || !this.medidorValido) {
      this.capturaForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    try {
      const { codigoMedidor, lectura, observacion } = this.capturaForm.value;
      const user = this.authService.currentUser;

      const result = await this.syncService.guardarYSincronizar({
        codigoMedidor: codigoMedidor.trim(),
        lectura: Number(lectura),
        observacion: observacion || '',
        fechaHora: new Date().toISOString(),
        cedulaOperador: user?.cedula || '',
        sincronizado: false,
      });

      if (result.sincronizado) {
        await this.mostrarToast('Lectura guardada y sincronizada', 'success');
      } else {
        await this.mostrarToast('Lectura guardada localmente', 'warning');
      }

      this.limpiarFormulario();
      await this.actualizarContadorPendientes();
    } catch (error: any) {
      await this.mostrarToast(error?.message || 'Error al guardar lectura', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  irAPendientes(): void {
    this.router.navigate(['/pendientes']);
  }

  async cerrarSesion(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesion',
      message: '¿Esta seguro que desea cerrar sesion?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Si, cerrar',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/login'], { replaceUrl: true });
          },
        },
      ],
    });
    await alert.present();
  }

  private limpiarFormulario(): void {
    this.capturaForm.reset();
    this.medidorValido = false;
    this.medidorActual = null;
    this.medidorError = '';
  }

  private async actualizarContadorPendientes(): Promise<void> {
    this.pendientesCount = await this.databaseService.contarPendientes();
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

  get nombrePropietario(): string {
    if (!this.medidorActual) return '';
    return this.medidoresService.getNombreCompleto(this.medidorActual);
  }
}
