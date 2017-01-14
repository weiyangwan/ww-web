import { Injectable }  from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import 'rxjs/Rx';
import { Observable, ReplaySubject } from 'rxjs';

import { Resource } from './resource';

@Injectable()
export class ResourceService  {
  private resources: Resource[] = [];

  updateResources = new ReplaySubject();

  // private url = 'http://localhost:9000';
  private url = 'https://vast-island-87972.herokuapp.com';

  constructor( private http: Http)  {}

  getResources(itineraryId)  {
    const itinId = '?itinId=' + itineraryId;
    return this.http.get( this.url + "/resource" + itinId)
                    .map((response: Response) => {
                      this.resources = response.json().resources;
                      this.updateResources.next(this.resources);
                      return this.resources;
                    })
                    .catch((error: Response) => Observable.throw(error.json()));
  }

  addResource(resource: Resource) {
    const body = JSON.stringify(resource);
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem('token') ? '?token=' + localStorage.getItem('token') : '';

    return this.http.post(this.url + '/resource/new' + token, body, { headers: headers })
                    .map((response: Response) => {
                      let newResource = response.json().resource;
                      newResource.user = {
                        _Id: resource['user']._Id,
                        username: resource['user'].username
                      }
                      this.resources.push(newResource);
                      this.updateResources.next(this.resources);
                      return response.json();
                    })
                    .catch((error: Response) => Observable.throw(error.json()));
  }

  editResource(resource: Resource)  {
    const body = JSON.stringify(resource);
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem('token') ? '?token=' + localStorage.getItem('token') : '';

    return this.http.patch( this.url + "/resource/" + resource['_id']+ token, body, { headers: headers })
                    .map((response: Response) => {
                      let index = this.resources.indexOf(resource);
                      this.resources[index] = resource;
                      this.updateResources.next(this.resources);
                      return response.json()
                    })
                    .catch((error: Response) => Observable.throw(error.json()));
  }

  deleteResource(resource: Resource)  {
    const token = localStorage.getItem('token') ? '?token=' + localStorage.getItem('token') : '';

    return this.http.delete( this.url + "/resource/" + resource['_id'] + token)
                    .map((response: Response) => {
                      this.resources.splice(this.resources.indexOf(resource), 1);
                      this.updateResources.next(this.resources);
                      return response.json()
                    })
                    .catch((error: Response) => Observable.throw(error.json()));
  }
}
