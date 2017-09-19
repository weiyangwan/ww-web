import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCitiesComponent } from './admin-cities.component';

describe('AdminCitiesComponent', () => {
  let component: AdminCitiesComponent;
  let fixture: ComponentFixture<AdminCitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminCitiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminCitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
