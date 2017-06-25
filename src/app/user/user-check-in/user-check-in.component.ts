import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Renderer2, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';

declare var google:any;
declare var MarkerClusterer:any;

import { CheckInService }     from '../../check-in';

@Component({
  selector: 'ww-user-check-in',
  templateUrl: './user-check-in.component.html',
  styleUrls: ['./user-check-in.component.scss']
})
export class UserCheckInComponent implements OnInit, OnDestroy {
  @ViewChild('map') map: ElementRef;
  itinMap;
  checkins;
  locations = [];
  locationIds = [];

  countries = [];

  checkInSubscription: Subscription;
  zoom = false;

  constructor(
    private renderer: Renderer2,
    private checkinService: CheckInService) { }

  ngOnInit() {
    setTimeout(() =>  {
      this.initMap();
    }, 100)

    this.checkInSubscription = this.checkinService.updateCheckIns.subscribe(
      result => {
        this.checkins = result;
        this.setCountries();
      })
  }

  ngOnDestroy() {
    if(this.checkInSubscription) this.checkInSubscription.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  checkClick(event) {
    if(!event.target.classList.contains("country-dropdown") &&
      !event.target.classList.contains("zoom")) {
      this.zoom = false;
    }
  }

  initMap() {
    let mapDiv = this.map.nativeElement;
    let center = {lat: 25, lng: 0};
    let zoom = 3;

    this.itinMap = new google.maps.Map(mapDiv, {
      center: center,
      zoom: zoom,
      styles: [{"stylers": [{ "saturation": -20 }]}]
    });

    this.setLocations();
  }

  setLocations()  {
    this.locations = [];
    this.locationIds = [];

    for (let i = 0; i < this.checkins.length; i++) {
      let index = this.locationIds.indexOf(this.checkins[i]['place']['_id']);

      this.checkins[i]['place']['created_at'] = [this.checkins[i]['created_at']];

      if(index < 0) {
        this.locations.push(this.checkins[i]['place']);
        this.locationIds.push(this.checkins[i]['place']['_id'])
      } else if (index >= 0)  {
        this.locations[index]['created_at'].push(this.checkins[i]['created_at'])
      }
    }

    this.setMarkers(this.itinMap);
  }

  setCountries()  {
    this.countries = [];
    let countryName = [];

    for (let i = 0; i < this.checkins.length; i++) {
      let index = countryName.indexOf(this.checkins[i]['place']['country']['name']);

      if(index < 0) {
        this.countries.push(this.checkins[i]['place']['country']);
        countryName.push(this.checkins[i]['place']['country']['name']);
      }
    }
    this.countries = this.sortCountries();
  }

  sortCountries() {
    this.countries.sort((a,b) =>  {
      if(a['name'] < b['name']) return -1;
      if(a['name'] > b['name']) return 1;
      return 0;
    })
    return this.countries;
  }

  setMarkers(map) {
    let markers = [];

    for (let i = 0; i < this.locations.length; i++) {
      let l = this.locations[i];
      let title;

      if(l['name'] !== '') {
        title = l['name'];
      } else  {
        title = l['address']
      }

      let marker = new google.maps.Marker({
        position: { lat: l['lat'], lng: l['lng']},
        map: map,
        title: title,
        zIndex: i
      })

      markers.push(marker);

      let created_at_string = '';

      for (let j = 0; j < this.locations[i]['created_at'].length; j++) {
        let checkIn = this.locations[i]['created_at'][j];
        let date = new Date(checkIn);
        let options = { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute:'numeric' };
        let created_at = date.toLocaleString('en-GB', options) + '<br>';

        created_at_string += created_at;
      }

      let content = '<div>' +
        '<h4>' + l['name'] + '</h4>' +
        '<h5>' +  l['address'] + '</h5>' +
        '<h6>' + created_at_string + '</h6>' +
        '</div>';

      let infoWindow = new google.maps.InfoWindow({
        content: content
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        let center = new google.maps.LatLng(l['lat'], l['lng'])

        map.panTo(center);
        map.setZoom(17);
      })
    }
    let imagePath = 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'

    let markerCluster = new MarkerClusterer(map, markers, {
            maxZoom: 15,
            imagePath: imagePath
          });

    this.preventScroll(false);
  }

  changeCenter(country) {
    let center = new google.maps.LatLng(country['lat'], country['lng']);

    this.itinMap.panTo(center);
    this.itinMap.setZoom(6);

    this.zoom = false;
  }

  preventScroll(value)  {
    if(value) {
      this.renderer.addClass(document.body, 'prevent-scroll');
    } else  {
      this.renderer.removeClass(document.body, 'prevent-scroll');
    }
  }
}
