import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs/Rx';

import { ItineraryService } from '../../../../itinerary.service';
import { Itinerary } from '../../../../itinerary';
import { ItineraryEvent } from '../../../itinerary-event';
import { ItineraryEventService } from '../../../itinerary-event.service';

import { UserService } from '../../../../../user';
import { FlashMessageService } from '../../../../../flash-message';

@Component({
  selector: 'ww-transport-form',
  templateUrl: './transport-form.component.html',
  styleUrls: ['./transport-form.component.scss']
})
export class TransportFormComponent implements OnInit {
  @Input() itinerary: Itinerary;
  @Output() cancelTransportForm = new EventEmitter();

  itinDateSubscription: Subscription;
  itinDateRange = [];

  currentUserSubscription: Subscription;
  currentUser;

  addTransportForm: FormGroup;
  transportType = [ 'flight', 'train', 'bus', 'cruise', 'vehicle rental', 'others' ];
  transportOption = 'flight';

  searchFlightForm: FormGroup;
  flightSearchDetail;
  stopOver = false; //to toggle view
  depAirports = [];
  arrAirports = [];
  populateFlightDetails = false;

  constructor(
    private itineraryService: ItineraryService,
    private itineraryEventService: ItineraryEventService,
    private userService: UserService,
    private flashMessageService: FlashMessageService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder) {
      this.addTransportForm = this.formBuilder.group({
        'transportType': '',
        'referenceNumber': '',
        'depTerminal': '',
        'arrTerminal': '',
        'depStation': '',
        'arrStation': '',
        'depCity': '',
        'arrCity': '',
        'depDate': '',
        'depTime': '',
        'arrDate': '',
        'arrTime': '',
        'transportCompany': '',
        'contactNumber': '',
        'note': '',
      }),
      this.searchFlightForm = this.formBuilder.group({
        'searchAirlineCode': ['', Validators.required],
        'searchFlightNumber': ['', Validators.required],
        'searchDepDate': ['', Validators.required],
      })
    }

  ngOnInit() {
    this.currentUserSubscription = this.userService.updateCurrentUser
                                       .subscribe(
                                         result => {
                                           this.currentUser = result;
                                         }
                                       )

    this.itinDateSubscription = this.itineraryService.updateDate
                                    .subscribe(
                                      result => {
                                        this.itinDateRange = Object.keys(result).map(key => result[key]);
                                    })
  }

  onSelectTransportType(transport)  {
    this.transportOption = transport;
  }

  // get flight details from flightstats.com
  searchFlightSubmit()  {
    let airlineCode = (this.searchFlightForm.value.searchAirlineCode).toUpperCase();
    let flightNumber = this.searchFlightForm.value.searchFlightNumber;

    let depDate = new Date(this.searchFlightForm.value.searchDepDate);
    let year = depDate.getFullYear();
    let month = depDate.getMonth() + 1;
    let day = depDate.getDate();

    let criteria = 'flight/' + airlineCode + '/' + flightNumber + '/departing/' + year + '/' + month + '/' + day;

    this.itineraryEventService.getFlightDetails(criteria)
        .subscribe(
          data => {
            let scheduledFlights = data['scheduledFlights'];
            let appendix = data['appendix'];

            let flightNumber = scheduledFlights[0].flightNumber;
            let carrierCode = scheduledFlights[0].carrierFsCode;
            let carrier;

            for (let i = 0; i < appendix.airlines.length; i++) {
              if (appendix.airlines[i].fs === carrierCode)  {
                carrier = appendix.airlines[i].name;
              }
            }

            if(scheduledFlights.length === 1) {
              let departureAirportCode = scheduledFlights[0].departureAirportFsCode;
              let arrivalAirportCode = scheduledFlights[0].arrivalAirportFsCode;
              let departureTerminal = scheduledFlights[0].departureTerminal;
              let departureTime = scheduledFlights[0].departureTime.slice(11,16);
              let arrivalTime = scheduledFlights[0].arrivalTime.slice(11,16);

              let departureYear = scheduledFlights[0].departureTime.slice(0,4);
              let departureMonth = scheduledFlights[0].departureTime.slice(5,7);
              let departureDay = scheduledFlights[0].departureTime.slice(8,10);
              let departureDate = "'" + departureYear + "-" + departureMonth + "-" + departureDay + "'";

              let arrivalYear = scheduledFlights[0].arrivalTime.slice(0,4);
              let arrivalMonth = scheduledFlights[0].arrivalTime.slice(5,7);
              let arrivalDay = scheduledFlights[0].arrivalTime.slice(8,10);
              let arrivalDate = "'" + arrivalYear + "-" + arrivalMonth + "-" + arrivalDay + "'";

              let departureAirport;
              let departureCity;
              let departureCountry;
              let departureAirportLocation;

              for (let i = 0; i < appendix.airports.length; i++) {
                if (appendix.airports[i].fs === departureAirportCode) {
                  departureAirport = appendix.airports[i].name;
                  departureCity = appendix.airports[i].city;
                  departureCountry = appendix.airports[i].countryName;
                  departureAirportLocation = {
                    lat: appendix.airports[i].latitude,
                    lng: appendix.airports[i].longitude,
                  }
                }
              }

              let arrivalAirport;
              let arrivalCity;
              let arrivalCountry;
              let arrivalAirportLocation;

              for (let i = 0; i < appendix.airports.length; i++) {
                if (appendix.airports[i].fs === arrivalAirportCode) {
                  arrivalAirport = appendix.airports[i].name;
                  arrivalCity = appendix.airports[i].city;
                  arrivalCountry = appendix.airports[i].countryName;
                  arrivalAirportLocation = {
                    lat: appendix.airports[i].latitude,
                    lng: appendix.airports[i].longitude,
                  }
                }
              }

              this.flightSearchDetail = {
                carrier: carrier,
                carrierCode: carrierCode,
                referenceNumber: flightNumber,
                depStation: departureAirport,
                depAirportCode: departureAirportCode,
                depCity: departureCity,
                depCountry: departureCountry,
                depTerminal: departureTerminal,
                depDate: departureDate,
                depTime: departureTime,
                depAirportLocation: departureAirportLocation,
                arrStation: arrivalAirport,
                arrAirportCode: arrivalAirportCode,
                arrCity: arrivalCity,
                arrCountry: arrivalCountry,
                arrDate: arrivalDate,
                arrTime: arrivalTime,
                arrAirportLocation: arrivalAirportLocation
              };
              this.populateFlightDetails = true;
            }//end of section where there is only 01 flight

            if (scheduledFlights.length > 1)  {
              this.stopOver = true;

              //convert departureTime to timestamp to sort by time
              for (let i = 0; i < scheduledFlights.length; i++) {
                scheduledFlights[i]['convertedDepartureTime'] = (new Date(scheduledFlights[i].departureTime)).getTime();
              }
              //sort the scheduledFlights array by time
              scheduledFlights.sort((a,b) =>  {
                return a['convertedDepartureTime'] - b['convertedDepartureTime'];
              })

              this.flightSearchDetail = data;
              this.flightSearchDetail['carrier'] = carrier;
              this.flightSearchDetail['carrierCode'] = carrierCode;
              this.flightSearchDetail['referenceNumber'] = flightNumber;

              //create list of airports for user to choose
              let airportBySchedule = [];

              for (let i = 0; i < scheduledFlights.length; i++) {
                  airportBySchedule.push(scheduledFlights[i].departureAirportFsCode);
              }
              airportBySchedule.push(scheduledFlights[scheduledFlights.length - 1].arrivalAirportFsCode);

              this.depAirports = [];
              for (let i = 0; i < airportBySchedule.length - 1; i++) {
                for (let j = 0; j < appendix.airports.length; j++) {
                  if (airportBySchedule[i] === appendix.airports[j].fs) {
                    this.depAirports.push({
                      city: appendix.airports[j].city,
                      airportName: appendix.airports[j].name,
                      airportCode: appendix.airports[j].fs
                    })
                  }
                }
              }

              this.arrAirports = [];
              for (let i = 1; i < airportBySchedule.length; i++) {
                for (let j = 0; j < appendix.airports.length; j++) {
                  if (airportBySchedule[i] === appendix.airports[j].fs) {
                    this.arrAirports.push({
                      city: appendix.airports[j].city,
                      airportName: appendix.airports[j].name,
                      airportCode: appendix.airports[j].fs
                    })
                  }
                }
              }
              this.populateFlightDetails = true;
            }//end of if more than 01 flight
          }
        )//end of subscribe

    this.searchFlightForm.reset({
      'searchAirlineCode': '',
      'searchFlightNumber': '',
      'searchDepDate': '',
    })
  }//end of flight search

  selectDepAirport(airportCode)  {
    let currentFlightSearch = this.flightSearchDetail;
    let scheduledFlights = currentFlightSearch['scheduledFlights'];
    let appendix = currentFlightSearch['appendix'];

    for (let i = 0; i < scheduledFlights.length; i++) {
      if(scheduledFlights[i]['departureAirportFsCode'] === airportCode) {
        currentFlightSearch['depAirportCode'] = scheduledFlights[i].departureAirportFsCode;
        currentFlightSearch['depTerminal'] = scheduledFlights[i].departureTerminal;
        currentFlightSearch['depTime'] = scheduledFlights[i].departureTime.slice(11,16);

        let departureYear = scheduledFlights[i].departureTime.slice(0,4);
        let departureMonth = scheduledFlights[i].departureTime.slice(5,7);
        let departureDay = scheduledFlights[i].departureTime.slice(8,10);
        currentFlightSearch['depDate'] = "'" + departureYear + "-" + departureMonth + "-" + departureDay + "'";
      }
    }

    for (let i = 0; i < appendix.airports.length; i++) {
      if (appendix.airports[i].fs === airportCode) {
        currentFlightSearch['depStation'] = appendix.airports[i].name;
        currentFlightSearch['depCity'] = appendix.airports[i].city;
        currentFlightSearch['depCountry'] = appendix.airports[i].countryName;
        currentFlightSearch['depAirportLocation'] = {
          lat: appendix.airports[i].latitude,
          lng: appendix.airports[i].longitude,
        }
      }
    }
  }

  selectArrAirport(airportCode) {
    let currentFlightSearch = this.flightSearchDetail;
    let scheduledFlights = currentFlightSearch['scheduledFlights'];
    let appendix = currentFlightSearch['appendix'];

    for (let i = 0; i < scheduledFlights.length; i++) {
      if(scheduledFlights[i]['arrivalAirportFsCode'] === airportCode) {
        currentFlightSearch['arrAirportCode'] = scheduledFlights[i].arrivalAirportFsCode;
        currentFlightSearch['arrTime'] = scheduledFlights[i].arrivalTime.slice(11,16);

        let arrivalYear = scheduledFlights[i].arrivalTime.slice(0,4);
        let arrivalMonth = scheduledFlights[i].arrivalTime.slice(5,7);
        let arrivalDay = scheduledFlights[i].arrivalTime.slice(8,10);
        currentFlightSearch['arrDate'] = "'" + arrivalYear + "-" + arrivalMonth + "-" + arrivalDay + "'";
      }
    }

    for (let i = 0; i < appendix.airports.length; i++) {
      if (appendix.airports[i].fs === airportCode) {
        currentFlightSearch['arrStation'] = appendix.airports[i].name;
        currentFlightSearch['arrCity'] = appendix.airports[i].city;
        currentFlightSearch['arrCountry'] = appendix.airports[i].countryName;
        currentFlightSearch['arrAirportLocation'] = {
          lat: appendix.airports[i].latitude,
          lng: appendix.airports[i].longitude,
        }
      }
    }
  }

  onSubmitNewTransports()  {
    let newTransport = this.addTransportForm.value;

    if(this.flightSearchDetail)  {
      for (var value in newTransport) {
        if(newTransport[value] === '' && this.flightSearchDetail[value]) {
          newTransport[value] = this.flightSearchDetail[value];
        }
      }
      newTransport['depAirportLocation'] = this.flightSearchDetail['depAirportLocation'];
      newTransport['arrAirportLocation'] = this.flightSearchDetail['arrAirportLocation'];
      newTransport['referenceNumber'] = this.flightSearchDetail['carrierCode'] + this.flightSearchDetail['referenceNumber'];
    }

    if(newTransport['transportType'] === '') {
      newTransport['transportType'] = 'flight'
    }

    newTransport['date'] = newTransport['depDate'];
    newTransport['time'] = newTransport['depTime']
    newTransport['type'] = 'transport';
    newTransport['user'] =  {
      _Id: this.currentUser['id'],
      username: this.currentUser['username'],
    }
    newTransport['created_at'] = new Date();

    this.itineraryEventService.addEvent(newTransport, this.itinerary)
        .subscribe(
          result => {
            this.flashMessageService.handleFlashMessage(result.message);
          })

    this.transportOption = 'flight';
    this.flightSearchDetail;
    this.cancelTransportForm.emit(false)
  }

  cancelForm()  {
    this.cancelTransportForm.emit(false)
  }

}