import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  apiPath: any = environment.API;
  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<any>(`${this.apiPath}/orders`);
  }

  insertOrder(order: Order) {
    return this.http.post<any>(`${this.apiPath}/orders`, order);
  }

  updateOrder(order: Order) {
    return this.http.put<any>(`${this.apiPath}/orders/${order.id}`, order);
  }

  deleteOrder(order: Order) {
    return this.http.delete<any>(`${this.apiPath}/orders/${order.id}`);
  }

  getRoute(start:number[], end:number[]): Observable<Order[]> {
    return this.http.get<any>(`https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`);
  }
}
