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
import { ClientService } from '../services/client.service';
import { Client } from '../models/client.model';
import { ItemService } from '../services/item.service';
import { OrderService } from '../services/order.service';
import { Item } from '../models/item.model';
import { Order } from '../models/order.model';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  public map!: Map;
  private vectorSource = new VectorSource();

  clients: Client[] = [];
  items: Item[] = [];
  orders: Order[] = [];

  formClient!: FormGroup;
  formItem!: FormGroup;

  isAlteration = false;
  preload = false;

  showOption1 = false;
  showOption2 = false;
  showOption3 = false;
  showOption4 = false;

  selectedClient: string = '';
  selectedItem: string = '';

  orederDescribe: string = '';

  tipo: String = '';
  action: String = '';

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private itemService: ItemService,
    private orderService: OrderService
  ) {}

  createFormClient(data: Client) {
    this.formClient = this.fb.group({
      name: [data.name, Validators.required],
      latitude: [
        data.latitude,
        [Validators.required, Validators.pattern(/^[-+]?[0-9]*\.?[0-9]+$/)],
      ],
      longitude: [
        data.latitude,
        [Validators.required, Validators.pattern(/^[-+]?[0-9]*\.?[0-9]+$/)],
      ],
      url_icon: [data.url_icon, Validators.required],
    });
  }

  createFormItem(data: Item) {
    this.formItem = this.fb.group({
      name: [data.name, Validators.required],
      latitude: [
        data.latitude,
        [Validators.required, Validators.pattern(/^[-+]?[0-9]*\.?[0-9]+$/)],
      ],
      longitude: [
        data.latitude,
        [Validators.required, Validators.pattern(/^[-+]?[0-9]*\.?[0-9]+$/)],
      ],
      url_icon: [data.url_icon, Validators.required],
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

    this.createFormClient(new Client());
    this.createFormItem(new Item());

    this.loadClients();
    this.loadItems();
    this.loadOrders();
    this.initMapItems();
  }

  initMapItems() {
    this.itemService.getItems().subscribe({
      next: (data: Client[]) => {
        this.items = data;
        console.log('Items loaded:', this.items);

        this.items.forEach((item) => {
          if (item.latitude != null && item.longitude != null) {
            const itemCoord: number[] = [
              Number(item.longitude),
              Number(item.latitude),
            ];
            this.addMarker(item, itemCoord, 'item');
          }
        });
      },
      error: (err) => console.error('Error loading items:', err),
    });
  }

  toggleOption(option: 'option1' | 'option2' | 'option3' | 'option4') {
    if (option === 'option1') {
      this.showOption1 = !this.showOption1;
    } else if (option === 'option2') {
      this.showOption2 = !this.showOption2;
    } else if (option === 'option3') {
      this.showOption3 = !this.showOption3;
    } else if (option === 'option4') {
      this.showOption4 = !this.showOption4;
    }

    this.clean();
  }

  addMarker(item: Item, coord: number[], type: 'client' | 'item') {
    const element = document.createElement('div');
    element.className = 'custom-marker';

    const iconUrl =
      type === 'client'
        ? 'assets/technical-support.png'
        : 'assets/advertising-panel.png';

    element.innerHTML = `
      <div class="marker-wrapper">
        <img src="assets/marker.png" class="marker-base">
        <img src="assets/${item.url_icon}" class="marker-icon">
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

    this.orderService.getRoute(start, end).subscribe((data: any) => {
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
    },
      (_) => {
        alert('Erro ao buscar rota');
        this.preload = false;
        this.initMapItems();
      });
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

    this.addMarker(selectedClient, startCoord, 'client');
    this.addMarker(selectedItem, endCoord, 'item');

    this.getRoute(startCoord, endCoord);
  }

  clearRoutes() {
    this.selectedClient = '';
    this.selectedItem = '';

    this.vectorSource.clear();

    this.map.getOverlays().clear();

    this.map.getView().setCenter(fromLonLat([-48.0, -15.8]));
    this.map.getView().setZoom(12);

    this.initMapItems();
  }

  setAction(tipo: String, action: String) {
    this.tipo = tipo;
    this.action = action;
  }

  clean() {
    this.tipo = '';
    this.action = '';
    this.orederDescribe = '';

    this.createFormClient(new Client());
    this.createFormClient(new Item());

    this.createFormClient(new Client());
    this.createFormItem(new Item());

    this.loadClients();
    this.loadItems();
    this.loadOrders();
    this.clearRoutes();
    this.initMapItems();
  }

  onItemChange(event: any) {
    this.selectedItem = event.target.value;

    const item: Item = this.items.find((i) => i.id == event.target.value)!;
    this.createFormItem(item);
  }

  onClientChange(event: any) {
    this.selectedClient = event.target.value;

    const client: Client = this.clients.find(
      (i) => i.id == event.target.value
    )!;
    this.createFormClient(client);
  }

  option() {
    if (
      this.tipo === 'client' &&
      this.action == 'add' &&
      this.formClient.valid
    ) {
      this.insertClient();
    } else if (
      this.tipo === 'item' &&
      this.action == 'add' &&
      this.formItem.valid
    ) {
      this.insertItem();
    } else if (
      this.tipo === 'client' &&
      this.action == 'edit' &&
      this.formClient.valid
    ) {
      this.updateClient();
    } else if (
      this.tipo === 'item' &&
      this.action == 'edit' &&
      this.formItem.valid
    ) {
      this.updateItem();
    }
  }

  insertClient() {
    const clientData = this.formClient.value;
    const client = new Client();
    const transformedClient = client.transform(clientData);
    transformedClient.active = 0;

    this.clientService.insertClient(transformedClient).subscribe(
      (_) => {
        this.preload = false;

        this.clean();

        alert('Client successfully registered!');
      },
      (_) => {
        alert('Could not register the client!');
        this.preload = false;
        this.initMapItems();
      }
    );
  }

  updateClient() {
    const clientData = this.formClient.value;
    const client = new Client();
    const transformedClient = client.transform(clientData);
    transformedClient.active = 0;
    transformedClient.id = parseInt(this.selectedClient);

    this.clientService.updateClient(transformedClient).subscribe(
      (_) => {
        this.preload = false;

        this.clean();

        alert('Client successfully updated!');
      },
      (_) => {
        alert('Could not update the client!');
        this.preload = false;
      }
    );
  }

  insertItem() {
    const itemData = this.formItem.value;
    const item = new Item();
    const transformedItem = item.transform(itemData);
    transformedItem.active = 0;

    this.itemService.insertItem(transformedItem).subscribe(
      (_) => {
        this.preload = false;

        this.clean();

        alert('Item successfully registered!');
      },
      (_) => {
        alert('Could not register the item!');
        this.preload = false;
        this.initMapItems();
      }
    );
  }

  updateItem() {
    const itemData = this.formItem.value;
    const item = new Item();
    const transformedItem = item.transform(itemData);
    transformedItem.active = 0;
    transformedItem.id = parseInt(this.selectedItem);

    this.itemService.updateItem(transformedItem).subscribe(
      (_) => {
        this.preload = false;

        this.clean();

        alert('Item successfully updated!');
      },
      (_) => {
        alert('Could not update the item!');
        this.preload = false;
        this.initMapItems();
      }
    );
  }

  onRemoveClientChange(event: any) {
    const id: number = parseInt(event.target.value);
    const client: Client = this.clients.find((c) => c.id == id)!;

    this.clientService.deleteClient(client).subscribe(
      (_) => {
        this.preload = false;

        this.clean();

        alert('Successfully remove!');
      },
      (_) => {
        alert('Could not remove!');
        this.preload = false;
        this.initMapItems();
      }
    );
  }

  onRemoveItemChange(event: any) {
    const id: number = parseInt(event.target.value);
    const item: Item = this.items.find((c) => c.id == id)!;

    this.itemService.deleteItem(item).subscribe(
      (_) => {
        this.preload = false;

        this.clean();

        alert('Successfully remove!');
      },
      (_) => {
        alert('Could not remove!');
        this.preload = false;
        this.initMapItems();
      }
    );
  }

  insertOrder() {
    const idClient: number = parseInt(this.selectedClient!);
    const idItem: number = parseInt(this.selectedItem!);

    const transformedOrder = new Order();
    transformedOrder.client = this.clients.find((c) => c.id == idClient)!;
    transformedOrder.item = this.items.find((c) => c.id == idItem)!;
    transformedOrder.description = this.orederDescribe;
    transformedOrder.active = 0;
    transformedOrder.dt = new Date();
    transformedOrder.status = 'Rota Salva';

    this.orderService.insertOrder(transformedOrder).subscribe(
      (_) => {
        this.preload = false;

        this.clean();

        alert('Order successfully registered!');
      },
      (_) => {
        alert('Could not register the oreder!');
        this.preload = false;
        this.initMapItems();
      }
    );
  }

  removeOrder(order: Order) {
    this.orderService.deleteOrder(order).subscribe(
      (data: any) => {
        this.preload = false;

        this.clean();
        this.clearRoutes();
        alert('Successfully remove!');
      },
      (error) => {
        alert('Could not remove!');
        this.preload = false;
        this.initMapItems();
      }
    );
  }

  initMapOrder(order: Order) {
    this.selectedClient = String(order.client?.id);
    this.selectedItem = String(order.item?.id);

    this.applySettings();
  }
}
