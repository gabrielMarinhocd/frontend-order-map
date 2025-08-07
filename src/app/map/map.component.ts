import { Component, OnInit } from '@angular/core';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { OSM } from 'ol/source';
import TileLayer from 'ol/layer/Tile';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';

import { Style, Stroke } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientService } from '../services/map.service';
import { Client } from '../models/client.model';
import { ItemService } from '../services/item.service';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  public map!: Map;
  private vectorSource = new VectorSource();

  clients: Client[] = [];
  clientSelect: Client = new Client();
  items: Client[] = [];
  itemSelect: Client = new Client();
  orders: Client[] = [];
  orderSelect: Client = new Client();
  newclient: Client = new Client();
  form: FormGroup;
  isAlteracao: boolean = false;
  preload: boolean = false;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private itemService: ItemService,
    private orderService: OrderService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    const startCoord = [-48.09855213700989, -15.84317502287108];
    const endCoord = [-47.89524641251749, -15.845669575445985];

    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new VectorLayer({
          source: this.vectorSource,
        }),
      ],
      view: new View({
        center: fromLonLat([
          (startCoord[0] + endCoord[0]) / 2,
          (startCoord[1] + endCoord[1]) / 2,
        ]),
        zoom: 13,
      }),
    });

    this.addMarker(startCoord, 'start');
    this.addMarker(endCoord, 'end');
    this.getRoute(startCoord, endCoord);
    this.loadClients();
    this.loadItems();
    this.loadOrders();
  }

  addMarker(coord: number[], type: 'start' | 'end') {
    const element = document.createElement('div');
    element.className = 'custom-marker';

    const iconUrl =
      type === 'start'
        ? 'assets/advertising-panel.png'
        : 'assets/technical-support.png';

    element.innerHTML = `
      <div class="marker-wrapper">
        <img src="assets/marker.png" class="marker-base">
        <img src="${iconUrl}" class="marker-icon">
      </div>
    `;

    const overlay = new Overlay({
      element: element,
      position: fromLonLat(coord),
      positioning: 'bottom-center',
      stopEvent: false,
    });

    this.map.addOverlay(overlay);
  }

  async getRoute(start: number[], end: number[]) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro in API OSRM');
      }
      const data = await response.json();

      const coords = data.routes[0].geometry.coordinates;
      const routeCoords = coords.map((c: number[]) => fromLonLat(c));

      const routeFeature = new Feature({
        geometry: new LineString(routeCoords),
      });

      routeFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'yellow',
            width: 5,
          }),
        })
      );

      this.vectorSource.addFeature(routeFeature);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  }

  loadClients(): void {
    this.clientService.getClients().subscribe(
      (data: Client[]) => {
        this.clients = data;
      },
      (err: any) => {
        console.error('Error loading clients:', err);
      }
    );
  }

  loadItems(): void {
    this.itemService.getItems().subscribe(
      (data: Client[]) => {
        this.items = data;
      },
      (err: any) => {
        console.error('Error loading items:', err);
      }
    );
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe(
      (data: Client[]) => {
        this.orders = data;
      },
      (err: any) => {
        console.error('Error loading orders:', err);
      }
    );
  }
}
