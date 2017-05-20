import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { Router } from '@angular/router';

import { User, UserService } from '../user';
import { Post, PostService } from '../post';
import { LoadingService }    from '../loading';

@Component({
  selector: 'ww-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  user: User;
  feed: Post[] = [];

  currentUserSubscription: Subscription;
  feedSubscription: Subscription;

  constructor(
    private userService: UserService,
    private postService: PostService,
    private loadingService: LoadingService,
    private router: Router) { }

  ngOnInit() {
    this.currentUserSubscription = this.userService.updateCurrentUser
                                       .subscribe(
                                         result => {
                                           this.user = result;
                                         }
                                       )

    this.postService.getFeed()
        .subscribe(
          result  => {
            this.feedSubscription = this.postService.updateFeed
                                        .subscribe(
                                          feedResult => {
                                            this.feed = Object.keys(feedResult).map(key => feedResult[key]);
                                          })
          })

    this.loadingService.setLoader(false, "");
  }

  ngOnDestroy() {
    this.feedSubscription.unsubscribe();
    this.currentUserSubscription.unsubscribe();
    this.loadingService.setLoader(true, "");
  }

  routeToItin(id) {
    this.router.navigateByUrl('/me/itinerary/' + id);
  }

}