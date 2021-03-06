import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs/Rx';

import { User, UserService }                       from '../../user';
import { RelationshipService }                     from '../../relationships';
import { ItineraryService, ItineraryEventService } from '../../itinerary';
import { AuthService }                             from '../../auth';
import { LoadingService }                          from '../../loading';
import { NotificationService }                     from '../../notifications';
import { FlashMessageService }                     from '../../flash-message';

@Component({
  selector: 'ww-main-navigation',
  templateUrl: './main-navigation.component.html',
  styleUrls: ['./main-navigation.component.scss']
})
export class MainNavigationComponent implements OnInit, OnDestroy {
  isLoggedIn = false;

  userSubscription: Subscription;
  user;

  relationshipSubscription: Subscription;
  socialRelationships = [];
  followings = [];
  followers = [];
  pendingFollowers = [];
  requestedFollowings = [];

  notificationSubscription: Subscription;
  notifications = [];

  showItineraryForm = false;
  fav = false;

  // auth
  showSignin = false;
  showSignup = false;
  reload = false;

  // top nav
  authOptions = false;
  bookmarkOptions = false;
  searchOptions = false;
  itineraryOptions = false;
  notificationOptions = false;
  profileOptions = false;

  newNotification = false;

  showUsers = false;
  users: User[] = [];
  filteredUsers;

  notificationsLimit = true;

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private userService: UserService,
    private authService: AuthService,
    private itineraryEventService: ItineraryEventService,
    private relationshipService: RelationshipService,
    private itineraryService: ItineraryService,
    private notificationService: NotificationService,
    private flashMessageService: FlashMessageService,
    private loadingService: LoadingService) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    this.userSubscription = this.userService.updateCurrentUser.subscribe(
      result => {
        this.user = result;
        this.getFollowings(this.user);
        this.notificationService.getNotifications(this.user['_id']).subscribe(
          data =>{})
      })

    this.relationshipSubscription = this.relationshipService.updateRelationships.subscribe(
      result => {
        this.socialRelationships = Object.keys(result['relationships']).map(key => result['relationships'][key]);;
        this.followers = Object.keys(result['followers']).map(key => result['followers'][key]);;
        this.followings = Object.keys(result['followings']).map(key => result['followings'][key]);;
        this.pendingFollowers = Object.keys(result['pendingFollowers']).map(key => result['pendingFollowers'][key]);;
        this.requestedFollowings = Object.keys(result['requestedFollowings']).map(key => result['requestedFollowings'][key]);;
        this.groupUsers();
      })

    this.notificationSubscription = this.notificationService.updateNotifications.subscribe(
      result => {
        this.notifications = Object.keys(result).map(key => result[key]);
        this.checkNewNotification();
      })

    if(this.isLoggedIn) {
      this.userService.getAllUsers().subscribe(
        result => {
          this.users = result.users;
          this.filteredUsers = this.users;
        })
    }


    if(!this.isLoggedIn)  {
      this.reload = true;
    }
  }

  ngOnDestroy() {
    if(this.userSubscription) this.userSubscription.unsubscribe();
    if(this.relationshipSubscription) this.relationshipSubscription.unsubscribe();
    if(this.notificationSubscription) this.notificationSubscription.unsubscribe();
  }

  getFollowings(user) {
    if(this.isLoggedIn) {
      this.relationshipService.getRelationships(user).subscribe(
        result => {})
    }
  }

  groupUsers()  {
    for (let i = 0; i < this.users.length; i++) {
      this.users[i]['follower_status'] = '';
      this.users[i]['following_status'] = '';

      if(this.socialRelationships.length > 0) {
        for (let j = 0; j < this.socialRelationships.length; j++) {
          let follower_id = this.socialRelationships[j]['user']['_id'];
          let following_id = this.socialRelationships[j]['following']['_id'];

          if(this.users[i]['_id'] === follower_id) {
            this.users[i]['follower_status'] = this.socialRelationships[j]['relative_status'];
          }

          if(this.users[i]['_id'] === following_id) {
            this.users[i]['following_status'] = this.socialRelationships[j]['relative_status'];
          }
        }
      }
    }
  }

  checkNewNotification()  {
    let checkDate = new Date(this.user['check_notification']).getTime();

    for (let i = 0; i < this.notifications.length; i++) {
      let itemDate = new Date(this.notifications[i]['created_at']).getTime();

      if(itemDate > checkDate)  {
        this.newNotification = true;
        this._document.getElementById('favicon').setAttribute('href', 'assets/ww_logo_notification.png');

        break;
      }
    }
  }



  // sign up / log in
  getSignin() {
    this.authOptions = false;
    this.showSignin = true;
    this.preventScroll(true);
  }

  getSignup() {
    this.authOptions = false;
    this.showSignup = true;
    this.preventScroll(true);
  }

  hideSignin()  {
    this.showSignin = false;
    this.preventScroll(false);
  }

  hideSignup()  {
    this.showSignup = false;
    this.preventScroll(false);
  }




  // top navigation favourite
  favourite() {
    this.fav = true;
    this.preventScroll(true);
  }

  cancelFav() {
    this.fav = false;
    this.preventScroll(false);
  }

  routeToRecommendations() {
    this.loadingService.setLoader(true, "");
    this.bookmarkOptions = false;

    this.router.navigateByUrl('/me/recommendations');
  }

  routeToFavs()  {
    this.loadingService.setLoader(true, "");
    this.bookmarkOptions = false;

    this.router.navigateByUrl('/me/favourite');
  }



  // top navigation itinerary
  newItin() {
    this.showItineraryForm = true;
  }

  routeToItinerary(id) {
    this.itineraryOptions = false;
    this.router.navigateByUrl('/me/itinerary/' + id);

    if(this.route.snapshot['_urlSegment'].segments[2]) {
      if(this.route.snapshot['_urlSegment'].segments[2].path !== id)  {
        this.loadingService.setLoader(true, "Fetching itinerary...");
      }
    }
  }

  routeToItineraries()  {
    this.loadingService.setLoader(true, "");
    this.itineraryOptions = false;

    this.router.navigateByUrl('/me/itinerary');
  }



  // top navigation notification/followers
  getNotifications()  {
    this.notificationOptions = true;
    this.newNotification = false;
    this._document.getElementById('favicon').setAttribute('href', 'assets/wondererwanderer_logo_thumbnail.png');

    this.user['check_notification'] = new Date();
    this.userService.editUser(this.user).subscribe(
      result => {})
  }

  routeToNotifications()  {
    this.notificationOptions = false;

    this.router.navigateByUrl('/me/notifications');
    this.loadingService.setLoader(true, "");
  }

  // route to profile
  routeToProfile()  {
    this.profileOptions = false;

    this.router.navigateByUrl('/me/home');
  }

  routeToProfileEdit()  {
    this.loadingService.setLoader(true, "");
    this.profileOptions = false;

    this.router.navigateByUrl('/me/profile-edit');
  }

  // user search
  getUsers()  {
    this.showUsers = true;
    this.preventScroll(true);

    this.userService.getAllUsers().subscribe(
      result => {
        this.users = result.users;
        this.filteredUsers = this.users;
        this.groupUsers();
      })
  }

  filterSearch(text)  {
    if(!text)   {
      this.filteredUsers = this.users;
    } else  {
      this.filteredUsers = Object.assign([], this.users).filter(
        user => user.username.toLowerCase().indexOf(text.toLowerCase()) > -1
      )
    }
  }

  follow(user)  {
    let following = {
      user: this.user,
      following: user,
    }

    let message = "You are now following " + user['username'];

    if(user['private']) {
      this.relationshipService.requestFollow(following).subscribe(
        result => { } )

      user['following_status'] = 'requestedFollowing';
    } else  {
      this.relationshipService.createFollow(following).subscribe(
        result => {
          this.flashMessageService.handleFlashMessage(message);
        })

      user['following_status'] = 'following';
    }

  }

  unfollow(user)  {
    this.loadingService.setLoader(true, "Unfollowing user...");

    let relationship;
    let status;

    if(user.following_status === 'following')  {
      for (let i = 0; i < this.followings.length; i++) {
        if(this.followings[i]['following']['_id'] === user["_id"]) {
          relationship = this.followings[i];
          status = "following";
        }
      }
    }

    if(user.following_status === 'requestedFollowing')  {
      for (let i = 0; i < this.requestedFollowings.length; i++) {
        if(this.requestedFollowings[i]['following']['_id'] === user["_id"]) {
          relationship = this.requestedFollowings[i];
          status = "requestedFollowing";
        }
      }
    }

    this.relationshipService.deleteFollow(relationship, status).subscribe(
      result => {
        user.following_status = '';
        this.loadingService.setLoader(false, "");
      })
  }

  cancelShowUsers() {
    this.showUsers = false;
    this.preventScroll(false);
    this.filteredUsers = this.users;
  }

  hideUserSearch(e)  {
    this.cancelShowUsers();
  }


  // routing to relationships
  routeToPendingFollowers() {
    this.loadingService.setLoader(true, "");
    this.notificationOptions = false;
    this.router.navigateByUrl('/me/relationships/follow-request');
  }


  // new itinerary
  hideItineraryForm(hide) {
    this.showItineraryForm = false;
    this.preventScroll(false);
  }


  // profile options
  logout()  {
    this.authService.logout();
    this.profileOptions = false;
  }


  // prevent scroll
  preventScroll(value)  {
    if(value) {
      this.renderer.addClass(document.body, 'prevent-scroll');
    } else  {
      this.renderer.removeClass(document.body, 'prevent-scroll');
    }
  }

  routeToHome() {
    if(this.isLoggedIn) {
      this.router.navigateByUrl('/me/home')
    } else  {
      this.router.navigateByUrl('/')
    }
  }

  routeToUser(id) {
    this.cancelShowUsers();
    if(id === this.user['_id']) {
      this.router.navigateByUrl('/me/home');
    } else  {
      this.router.navigateByUrl('/wondererwanderer/' + id)
    }
  }
}
