import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { routing } from './app.routing';

import { AppComponent } from './app.component';

import { AuthComponent, AuthService, SignupComponent, SigninComponent } from './auth';
import { UserComponent, UserService, ProfileComponent, ProfileDetailsComponent, FollowingComponent, FollowingService } from './user';

import { MeComponent } from './me';
import { MainNavigationComponent, SideNavigationComponent } from './navigation';

import { PostsComponent, PostComponent, PostInputComponent, PostListComponent, PostService } from './post';

import { GooglePlaceSearchComponent, GoogleCheckinComponent } from './google-api';

import { ItineraryComponent, ItineraryAccommodationTransportComponent, ItineraryEventsComponent, ItineraryService, ItineraryActivityComponent, ItineraryResourcesComponent, ResourceInputComponent, ResourceService, ResourceListComponent, ResourceComponent, ItineraryMapComponent, AccommodationFormComponent, TransportFormComponent, ItineraryEventService, ActivityComponent, ActivityListComponent, ActivityInputComponent, ActivityCollapseComponent, ActivityCollapseListComponent } from './itinerary';

import { FlashMessageComponent, FlashMessageService } from './flash-message';


@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    SignupComponent,
    SigninComponent,
    UserComponent,
    ProfileComponent,
    ProfileDetailsComponent,
    FollowingComponent,
    MeComponent,
    MainNavigationComponent,
    SideNavigationComponent,
    PostsComponent,
    PostInputComponent,
    PostListComponent,
    PostComponent,
    ItineraryComponent,
    ItineraryEventsComponent,
    ItineraryAccommodationTransportComponent,
    AccommodationFormComponent,
    TransportFormComponent,
    ItineraryActivityComponent,
    ActivityComponent,
    ActivityListComponent,
    ActivityInputComponent,
    ActivityCollapseComponent,
    ActivityCollapseListComponent,
    GooglePlaceSearchComponent,
    GoogleCheckinComponent,
    ItineraryResourcesComponent,
    ResourceInputComponent,
    ResourceListComponent,
    ResourceComponent,
    ItineraryMapComponent,
    FlashMessageComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    routing,
  ],
  providers: [ AuthService, UserService, PostService, ItineraryService, ItineraryEventService, ResourceService, FlashMessageService, FollowingService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
