import { Component, OnInit, OnDestroy, Output, EventEmitter, Renderer2, ElementRef } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs/Rx';

import { AuthService }           from '../auth/auth.service';
import { Itinerary }             from './itinerary';
import { ItineraryService }      from './itinerary.service';
import { ItineraryEventService } from './itinerary-events/itinerary-event.service';
import { FlashMessageService }   from '../flash-message';
import { User, UserService }     from '../user';
import { ResourceService }       from './itinerary-resources/resource.service';
import { NotificationService }   from '../notifications';
import { LoadingService }        from '../loading';

@Component({
  selector: 'ww-itinerary',
  templateUrl: './itinerary.component.html',
  styleUrls: ['./itinerary.component.scss']
})
export class ItineraryComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  preview = false;
  previewMessage = false;

  invalidPreview = false; // preview not avail for non-corporate/non-publish itin
  validUser = false;      // user not valid if not a member of itinerary
  validAccess = false;    // not valid when preview invalid && user not valid
  loadingMessage = "";

  creator = false; // to hide copy option if creator view preview

  itinerarySubscription: Subscription;
  itinerary;
  events = [];
  resources = [];

  currentUserSubscription: Subscription;
  currentUser: User;

  showUsersSearch = false;
  users: User[] = [];
  filteredResult;
  newMembers = [];
  validAddUser = false;

  showAddNew = false;
  addAccommodation = false;
  addTransport = false;
  addActivity = false;
  addResource = false;

  inviteLink = '';

  authOptions = false;
  showSignin = false;
  showSignup = false;
  reload = false;


  // toggle show in mobile
  showNav = false;
  showCurrentMembers = false;
  currentRoute = '';

  constructor(
    private authService: AuthService,
    private element: ElementRef,
    private renderer: Renderer2,
    private loadingService: LoadingService,
    private itineraryService: ItineraryService,
    private itineraryEventService: ItineraryEventService,
    private resourceService: ResourceService,
    private flashMessageService: FlashMessageService,
    private notificationService: NotificationService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router) { }


  // log in / preview -> can see / cannot edit (log in + preview = can see itin ) + can add itin
  // log in / not preview -> only valid user in itinerary can see and edit (log in + not preview + valid user = can see/edit itin)
  // not log in / preview -> can see / cannot edit (log in + preview = can see itin ) + cannot add itin
  // not log in / not preview -> cannot see

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    let segments = this.route.snapshot['_urlSegment'].segments;
    if(segments[0]['path'] === 'preview') {
      this.preview = true;
      this.reload = true;
    }

    this.currentRoute = segments[3]['path']

    this.route.params.forEach((params: Params) => {
      let id = params['id'];

      this.itineraryService.getItin(id).subscribe(
        result => {
          this.itinerarySubscription = this.itineraryService.currentItinerary.subscribe(
              result =>  {
                this.itinerary = result;

                this.invalidPreview = false;
                this.validUser = false;
                this.validAccess = false;
                this.creator = false;

                if(id === this.itinerary['_id']) this.checkPreview();

                if(!this.preview && this.isLoggedIn)  {
                  this.getAllUsers();
                  this.setInviteLink();
                }
              })

          this.itineraryEventService.getEvents(id).subscribe(
               eventResult => { this.events = eventResult })

          this.resourceService.getResources(id).subscribe(
               resourceResult => { this.resources = resourceResult })
        }
      )
    })

    this.currentUserSubscription = this.userService.updateCurrentUser.subscribe(
      result => { this.currentUser = result; })
  }

  ngOnDestroy() {
    if(this.itinerarySubscription) this.itinerarySubscription.unsubscribe();
    if(this.currentUserSubscription) this.currentUserSubscription.unsubscribe();
  }

  checkPreview()  {
    // invalid preview for non-corporate itinerary or corporate itinerary not published
    if((this.preview && !this.itinerary['corporate']['status']) ||
       (this.preview && this.itinerary['corporate']['status'] && !this.itinerary['corporate']['publish']))  {
      this.invalidPreview = true;

      setTimeout(() =>  {
        this.loadingService.setLoader(false, "");
      }, 300)

    } else  {
      setTimeout(() =>  {
        this.checkAccess();
      },3000)
    }
  }

  checkAccess() {
    // valid access if preview, corporate & published
    // valid access for non preview, logged in and valid user
    if(this.isLoggedIn) {
      for (let i = 0; i < this.itinerary['members'].length; i++) {
        if(this.itinerary['members'][i]['_id'] === this.currentUser['_id']) {
          this.validUser = true;
        }
      }

      if(this.currentUser['_id'] === this.itinerary['created_by']['_id']) {
        this.creator = true;
      }
    }

    console.log("validUser: " + this.validUser)

    if((this.preview && this.itinerary['corporate']['status'] && this.itinerary['corporate']['publish']) ||
       (!this.preview && this.isLoggedIn && this.validUser))  {

      this.validAccess = true;

    } else if(this.preview && !this.invalidPreview) {

      this.previewMessage = true;

      setTimeout(() => {
        this.previewMessage = false;
      }, 8000)
    } else if(!this.validAccess) {
      this.loadingMessage = 'You are not authorised to access the selected itinerary.';
    }

    this.loadingService.setLoader(false, "");
  }

  getAllUsers() {
    this.userService.getAllUsers().subscribe(
      result => { this.filterUsers(result.users); })
  }

  filterUsers(users)  {
    this.users = users;

    for (let i = 0; i < this.itinerary['members'].length; i++) {
      for (let j = 0; j < this.users.length; j++) {
        if(this.itinerary['members'][i]['_id'] === this.users[j]['_id']) {
          this.users.splice(j,1);
          j--;
        }
      }
    }
  }

  setInviteLink() {
    this.inviteLink = 'https://wondererwanderer.herokuapp.com/#/invite/me/' + this.itinerary['_id'];
  }


  // show add members modal
  inviteUsers()  {
    this.showUsersSearch = true;
    this.showAddNew = false;
    this.showCurrentMembers = false;
    this.preventScroll(true);
  }

  // add members modal
  filterSearch(text)  {
    if(!text)   {
      this.filteredResult = [];
    } else  {
      this.filteredResult = Object.assign([], this.users).filter(
        user => user.username.toLowerCase().indexOf(text.toLowerCase()) > -1
      )
    }
  }

  cancelShowUsers() {
    this.showUsersSearch = false;
    this.preventScroll(false);
    this.filteredResult = [];
    this.users.push.apply(this.users, this.newMembers);

    this.newMembers = [];
  }

  toggleAdd(user) {
    let index = this.newMembers.indexOf(user);

    if(index > -1 ) {
      this.newMembers.splice(index, 1);
      this.users.push(user);
      this.filteredResult.push(user);
    }

    if(index < 0 )  {
      this.newMembers.push(user);
      this.users.splice(this.users.indexOf(user), 1);
      this.filteredResult.splice(this.filteredResult.indexOf(user),1)
    }

    if(this.newMembers.length > 0) {
      this.validAddUser = true;
    }

    if(this.newMembers.length < 1) {
      this.validAddUser = false;
    }
  }

  addMembers()  {
    for (let i = 0; i < this.newMembers.length; i++) {
      this.itinerary['members'].push(this.newMembers[i]);
    }

    this.itineraryService.editItin(this.itinerary, 'edit').subscribe(
      data => {
        for (let i = 0; i < this.newMembers.length; i++) {

          this.notificationService.newNotification({
            recipient: this.newMembers[i],
            originator: this.currentUser,
            message: " has included you to the itinerary" + this.itinerary['name'],
            link: "/me/itinerary/" + this.itinerary['_id'],
            read: false
          })

        }
      })

    this.flashMessageService.handleFlashMessage("Users added to the itinerary");

    this.cancelShowUsers();
  }


  // show and hide current members
  showMembers() {
    this.showCurrentMembers = true;

    this.showNav = false;
    this.showAddNew = false;
    this.preventScroll(true);
  }

  hideMembers() {
    this.showCurrentMembers = false;
    this.preventScroll(false);
  }


  // itinerary nav tabs to access forms
  showAddNewOptions() {
    this.showAddNew = true;

    this.showNav = false;
    this.showCurrentMembers = false;
    this.preventScroll(true);
  }

  cancelAddNewOptions() {
    this.showAddNew = false;
    this.preventScroll(false);
  }

  newAccommodation()  {
    this.addAccommodation = true;

    this.showAddNew = false;
    this.addTransport = false;
    this.addActivity = false;
    this.addResource = false;
    this.preventScroll(true);
  }

  newTransport()  {
    this.addTransport = true;

    this.showAddNew = false;
    this.addAccommodation = false;
    this.addActivity = false;
    this.addResource = false;
    this.preventScroll(true);
  }

  newActivity()  {
    this.addActivity = true;

    this.showAddNew = false;
    this.addAccommodation = false;
    this.addTransport = false;
    this.addResource = false;
    this.preventScroll(true);
  }

  newResource()  {
    this.addResource = true;

    this.showAddNew = false;
    this.addAccommodation = false;
    this.addTransport = false;
    this.addActivity = false;
    this.preventScroll(true);
  }


  // hide forms
  hideAccommodationForm(hide)  {
    this.addAccommodation = false;
    this.preventScroll(false);
  }

  hideTransportForm(hide)  {
    this.addTransport = false;
    this.preventScroll(false);
  }

  hideActivityForm(hide)  {
    this.addActivity = false;
    this.preventScroll(false);
  }

  hideResourceForm(hide)  {
    this.addResource = false;
    this.preventScroll(false);
  }



  // to close any open modal when navigate to child routes
  activateTab(route) {
    if(route !== '')  {
      this.currentRoute = route;
    }

    this.showNav = false;
    this.showAddNew = false;
    this.showCurrentMembers = false;
    this.showUsersSearch = false;
    this.preventScroll(false);
  }


  // to toggle nav and close any open modal in mobile < 420px
  toggleNav() {
    this.showNav = !this.showNav;

    if(this.showNav)  {
      this.showAddNew = false;
      this.showCurrentMembers = false;
      this.showUsersSearch = false;
    }
  }


  // copy a preview itinerary
  copy()  {
    if(this.isLoggedIn) {
      this.duplicate();
    } else if(!this.isLoggedIn) {
      this.authOptions = true;
      this.preventScroll(true);
    }

    this.showNav = false;
  }

  duplicate() {
    this.loadingService.setLoader(true, "Saving to your list of itineraries");

    let newItinerary = {
      name: this.itinerary['name'] + " - created by " + this.itinerary['created_by']['username'],
      date_from: this.itinerary['date_from'],
      date_to: this.itinerary['date_to'],
      daily_note: this.itinerary['daily_note'],
      private: this.currentUser['privacy']['itinerary'],
      members: [this.currentUser['_id']],
      admin: [this.currentUser['_id']],
      created_by: this.itinerary['created_by'],
      taken_from: this.itinerary['created_by']
    }

    this.itineraryService.addItin(newItinerary).subscribe(
      result => {
        this.shareEvents(result.itinerary);
      })

    if(this.itinerary['taken_by'])  {
      this.itinerary['taken_by'].push(this.currentUser['_id']);
    } else  {
      this.itinerary['taken_by'] = [this.currentUser['_id']];
    }

    this.itineraryService.editItin(this.itinerary, '').subscribe(
      result =>{})
  }

  shareEvents(itinerary) {
    for (let i = 0; i < this.events.length; i++) {
      delete this.events[i]['_id'];
      delete this.events[i]['created_at'];
      delete this.events[i]['itinerary'];

      this.itineraryEventService.copyEvent(this.events[i], itinerary).subscribe(
        result => {})
    }

    for (let i = 0; i < this.resources.length; i++) {
      delete this.resources[i]['_id'];
      delete this.resources[i]['created_at'];
      delete this.resources[i]['itinerary'];

      this.resources[i]['itinerary'] = itinerary;

      this.resourceService.copyResource(this.resources[i]).subscribe(
        result => {})
    }

    this.router.navigateByUrl('/me/itinerary/' + itinerary['_id'])
  }



  // sign up / log in
  cancelAuth()  {
    this.authOptions = false;
    this.preventScroll(false);
  }

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


  // others
  preventScroll(value)  {
    if(value) {
      this.renderer.addClass(document.body, 'prevent-scroll');
    } else  {
      this.renderer.removeClass(document.body, 'prevent-scroll');
    }
  }

  scrollLeft()  {
    this.element.nativeElement.firstElementChild.children[4].firstElementChild.firstElementChild.scrollLeft -= 100;
  }

  scrollRight() {
    this.element.nativeElement.firstElementChild.children[4].firstElementChild.firstElementChild.scrollLeft += 100;
  }

  routeToUser(id) {
    if(id === this.currentUser['_id']) {
      this.router.navigateByUrl('/me/profile');
    } else  {
      this.router.navigateByUrl('/wondererwanderer/' + id)
    }
  }

  routeToPreview()  {
    this.loadingService.setLoader(true, "Routing to preview...");
    this.router.navigateByUrl('/preview/itinerary/' + this.itinerary['_id'])
  }

}
