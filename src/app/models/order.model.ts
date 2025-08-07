import { Client } from './client.model'; // ajuste o caminho conforme seu projeto
import { Item } from './item.model';

export class Order {
  constructor(
    public id?: number,
    public dt?: Date, // Timestamp → Date em TypeScript
    public description?: string,
    public status?: string,
    public active?: number,
    public client?: Client,
    public item?: Item
  ) {}

  transform(dados: any): Order {
    if (dados) {
      this.id = dados.id;
      this.dt = dados.dt ? new Date(dados.dt) : undefined;
      this.description = dados.description;
      this.status = dados.status;
      this.active = dados.active;
      this.client = dados.client ? new Client().transform(dados.client) : undefined;
      this.item = dados.item ? new Item().transform(dados.item) : undefined;
    }
    return this;
  }
}
