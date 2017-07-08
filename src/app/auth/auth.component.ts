import { Component, OnInit, Input, NgZone, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
declare const FB: any;
declare const gapi: any;

import { AuthService }       from './auth.service';
import { UserService }       from '../user';
import { LoadingService }    from '../loading';
import { ItineraryService }  from '../itinerary';

@Component({
  selector: 'ww-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, AfterViewInit {

  @Input() reroute;
  @Input() itinerary;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private itineraryService: ItineraryService,
    private loadingService: LoadingService,
    private _zone: NgZone,
    private router: Router)  {
      FB.init({
            appId      : '1751057965157438', //1751057965157438 - 1751163758480192
            cookie     : false,  // enable cookies to allow the server to access the session
            xfbml      : true,  // parse social plugins on this page
            version    : 'v2.5' // use graph api version 2.5
        });
    }

  ngOnInit()  {
    this.loadingService.setLoader(false, "");
    // FB.getLoginStatus(response => {
    //   this.statusChangeCallback(response);
    // });
  }

  statusChangeCallback(res) {
    // https://developers.facebook.com/docs/facebook-login/web
    if (res.status === 'connected') {
      this.getDetails()
    }
  };

  loginFacebook() {
    FB.login((response) =>  {
      this.loadingService.setLoader(true, "get ready to wonder wander");

      this.getDetails();
    }, {scope: 'email' });
  }

  getDetails() {
    FB.api('/me?fields=id,name,gender,picture.width(150).height(150),email',
      (result) => {
        if (result && !result.error) {
          // if no email, to open up a modal notice and to sign up or sign in
          result['username'] = result['name'];
          result['display_picture'] = result['picture']['data']['url'];

          this.authService.loginFacebook(result)
              .subscribe(
                data => {
                  this.loadingService.setLoader(true, "We are redirecting you");

                  this.userService.getCurrentUser()
                      .subscribe(data => {});

                  this.rerouting({_id: data.userId});
                }
              )
        } else {
          console.log(result.error);
        }
      });
  }

  // https://developers.google.com/identity/sign-in/web/sign-in
  ngAfterViewInit() {
    gapi.signin2.render('google-login', {
      'longtitle': true,
      'width': 300,
      'height': 30,
      'theme': 'dark',
      // 'onsuccess': params => this.loginGoogle(params),
      // 'onfailure': onFailure
    })
  }

  // http://stackoverflow.com/questions/35530483/google-sign-in-for-websites-and-angular-2-using-typescript
  loginGoogle(user) {
    let profile = user.getBasicProfile();
    let email = profile.getEmail();
    let username = profile.getName();
    let display_picture = profile.getImageUrl();
    console.log("log in google")
    this.authService.loginGoogle({
      username: username,
      email: email,
      display_picture: display_picture,
    }).subscribe( data => {
      console.log("log in google ok")
      this.loadingService.setLoader(true, "get ready to wonder wander");

      let user = {_id: data.userId};
      this.rerouting(user);
    });
  }

  rerouting(user) {
    this.userService.getCurrentUser().subscribe(
          data => {});
          
    if(this.reroute !== '/me')  {
      this.addToItin(user);
    } else  {
      setTimeout(() =>  {
        this.router.navigateByUrl(this.reroute);
      }, 1000)
    }
  }

  addToItin(user) {
    this.itinerary['members'].push(user);

    this.itineraryService.editItin(this.itinerary, 'edit').subscribe(
      data => {
        setTimeout(() =>  {
          this.router.navigateByUrl(this.reroute);
        }, 1000)
      })
  }
}
