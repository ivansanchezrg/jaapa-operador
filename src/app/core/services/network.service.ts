import { Injectable } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private isOnline$ = new BehaviorSubject<boolean>(true);
  private connectionType$ = new BehaviorSubject<string>('unknown');

  constructor() {
    this.initNetworkListener();
  }

  private async initNetworkListener(): Promise<void> {
    const status = await Network.getStatus();
    this.updateStatus(status);

    Network.addListener('networkStatusChange', (status) => {
      this.updateStatus(status);
    });
  }

  private updateStatus(status: ConnectionStatus): void {
    this.isOnline$.next(status.connected);
    this.connectionType$.next(status.connectionType);
    console.log('Network status:', status.connected ? 'Online' : 'Offline', `(${status.connectionType})`);
  }

  get online$(): Observable<boolean> {
    return this.isOnline$.asObservable();
  }

  get connectionType(): Observable<string> {
    return this.connectionType$.asObservable();
  }

  get isOnline(): boolean {
    return this.isOnline$.value;
  }

  async checkConnection(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }
}
