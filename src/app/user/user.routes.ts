import { Routes } from "@angular/router";

import { UserPostsComponent }       from './user-posts/user-posts.component';
import { UserFollowingsComponent }  from './user-followings/user-followings.component';
import { UserFollowersComponent }   from './user-followers/user-followers.component';
import { UserItinerariesComponent } from './user-itineraries/user-itineraries.component';
import { UserCheckInComponent }     from './user-check-in/user-check-in.component';

export const USER_ROUTES: Routes = [
  { path: '', component: UserPostsComponent },
  { path: 'followers', component: UserFollowersComponent },
  { path: 'followings', component: UserFollowingsComponent },
  { path: 'itineraries', component: UserItinerariesComponent },
  { path: 'check-in', component: UserCheckInComponent },
]
