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
  items: Client[] = [];
  orders: Client[] = [];

  form: FormGroup;
  isAlteration = false;
  preload = false;

  showOption1 = false;
  showOption2 = false;
  showOption3 = false;

  selectedClient: string = '';
  selectedItem: string = '';

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
        center: fromLonLat([-48.0, -15.8]),
        zoom: 12,
      }),
    });

    this.loadClients();
    this.loadItems();
    this.loadOrders();
  }

  toggleOption(option: 'option1' | 'option2' | 'option3') {
    if (option === 'option1') {
      this.showOption1 = !this.showOption1;
    } else if (option === 'option2') {
      this.showOption2 = !this.showOption2;
    } else if (option === 'option3') {
      this.showOption3 = !this.showOption3;
    }
  }

  addMarker(coord: number[], type: 'client' | 'item') {
    const element = document.createElement('div');
    element.className = 'custom-marker';

    const iconUrl =
      type === 'client'
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
        throw new Error('Error with OSRM API');
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

      this.vectorSource.clear();
      this.vectorSource.addFeature(routeFeature);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        console.log('Clients loaded:', this.clients);
      },
      error: (err) => console.error('Error loading clients:', err),
    });
  }

  loadItems(): void {
    this.itemService.getItems().subscribe({
      next: (data: Client[]) => {
        this.items = data;
        console.log('Items loaded:', this.items);
      },
      error: (err) => console.error('Error loading items:', err),
    });
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (data: Client[]) => {
        this.orders = data;
        console.log('Orders loaded:', this.orders);
      },
      error: (err) => console.error('Error loading orders:', err),
    });
  }

  applySettings() {
    if (!this.selectedClient || !this.selectedItem) {
      alert('Please select a client and an item to show the route.');
      return;
    }

    const selectedClientId = Number(this.selectedClient);
    const selectedItemId = Number(this.selectedItem);

    const selectedClient = this.clients.find((c) => c.id === selectedClientId);
    const selectedItem = this.items.find((i) => i.id === selectedItemId);

    if (!selectedClient || !selectedItem) {
      alert('Invalid client or item.');
      return;
    }

    if (
      selectedClient.latitude == null ||
      selectedClient.longitude == null ||
      selectedItem.latitude == null ||
      selectedItem.longitude == null
    ) {
      alert('Client or item does not have valid coordinates.');
      return;
    }

    const startCoord: number[] = [
      Number(selectedClient.longitude),
      Number(selectedClient.latitude),
    ];

    const endCoord: number[] = [
      Number(selectedItem.longitude),
      Number(selectedItem.latitude),
    ];

    const center = [
      (startCoord[0] + endCoord[0]) / 2,
      (startCoord[1] + endCoord[1]) / 2,
    ];

    this.map.getView().setCenter(fromLonLat(center));
    this.map.getView().setZoom(14);

    this.vectorSource.clear();
    this.map.getOverlays().clear();

    this.addMarker(startCoord, 'client');
    this.addMarker(endCoord, 'item');

    this.getRoute(startCoord, endCoord);
  }

  clearRoutes() {
    this.selectedClient = '';
    this.selectedItem = '';

    this.vectorSource.clear();

    this.map.getOverlays().clear();

    this.map.getView().setCenter(fromLonLat([-48.0, -15.8]));
    this.map.getView().setZoom(12);
  }
}
