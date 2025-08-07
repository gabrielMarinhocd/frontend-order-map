export class Client {
  constructor(
    public id?: number,
    public name?: string,
    public latitude?: string,
    public longitude?: string,
    public url_icon?: string,
    public active?: number
  ) {}

  transform(dados: any): Client {
    if (dados) {
      this.id = dados.id;
      this.name = dados.name;
      this.latitude = dados.latitude;
      this.longitude = dados.longitude;
      this.url_icon = dados.url_icon;
      this.active = dados.active;
    }
    return this;
  }
}
