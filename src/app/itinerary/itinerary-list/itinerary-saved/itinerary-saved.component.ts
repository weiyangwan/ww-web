import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Rx';
import { Title }        from '@angular/platform-browser';

import { UserService }  from '../../../user';
import { LoadingService } from '../../../loading';

@Component({
  selector: 'ww-itinerary-saved',
  templateUrl: './itinerary-saved.component.html',
  styleUrls: ['./itinerary-saved.component.scss']
})
export class ItinerarySavedComponent implements OnInit, OnDestroy {
  itineraries;
  filteredItineraries =[];

  user;
  userSubscription: Subscription;

  constructor(
    private titleService: Title,
    private loadingService: LoadingService,
    private userService: UserService) { }

  ngOnInit() {
    this.loadingService.setLoader(true,"")

    this.titleService.setTitle("Saved itineraries");

    this.userSubscription = this.userService.updateCurrentUser.subscribe(
     result => {
       this.user = result;
       this.itineraries = this.user['saves']['itineraries'];
       this.filteredItineraries = this.itineraries;

       this.loadingService.setLoader(false,"")
     })
  }

  ngOnDestroy() {
    if(this.userSubscription) this.userSubscription.unsubscribe();
  }

  filterSearch(text)  {
    if(!text)   {
      this.filteredItineraries = this.itineraries;
    } else  {
      this.filteredItineraries = Object.assign([], this.itineraries).filter(
        itin => itin.name.toLowerCase().indexOf(text.toLowerCase()) > -1
      )
    }
  }

}
