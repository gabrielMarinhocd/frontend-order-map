import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  apiPath: any = environment.API;
  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<any>(`${this.apiPath}/clients`);
  }

  insertClient(client: Client) {
    return this.http.post<any>(`${this.apiPath}/clients`, client);
  }

  updateClient(client: Client) {
    return this.http.put<any>(
      `${this.apiPath}/clients?id=${client.id}`,
      client
    );
  }

  deleteClient(client: Client) {
    return this.http.delete<any>(`${this.apiPath}/clients?id=${client.id}`);
  }
}
