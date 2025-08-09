import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  apiPath: any = environment.API;
  constructor(private http: HttpClient) {}

  getItems(): Observable<Item[]> {
    return this.http.get<any>(`${this.apiPath}/items`);
  }

  insertItem(item: Item) {
    return this.http.post<any>(`${this.apiPath}/items`, item);
  }

  updateItem(item: Item) {
    return this.http.put<any>(`${this.apiPath}/items/${item.id}`, item);
  }

  deleteItem(item: Item) {
    return this.http.delete<any>(`${this.apiPath}/items/${item.id}`);
  }
}
