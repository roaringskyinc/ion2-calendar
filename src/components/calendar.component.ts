import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  forwardRef
} from '@angular/core';

import { CalendarMonth, CalendarModalOptions, CalendarComponentOptions } from '../calendar.model'
import { CalendarService } from "../services/calendar.service";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import * as moment from 'moment';

export const ION_CAL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CalendarComponent),
  multi: true
};

@Component({
  selector: 'ion-calendar',
  providers: [ION_CAL_VALUE_ACCESSOR],
  template: `
    <div class="title">
      <div class="text">
        {{monthOpt.original.time | date: _d.monthFormat}}
      </div>
      <button ion-button clear class="back" [disabled]="!canBack()" (click)="backMonth()">
        <ion-icon name="ios-arrow-back"></ion-icon>
      </button>
      <button ion-button clear class="forward" [disabled]="!canNext()" (click)="nextMonth()">
        <ion-icon name="ios-arrow-forward"></ion-icon>
      </button>
    </div>

    <ion-calendar-week color="transparent"
                       [weekStart]="_d.weekStart">
    </ion-calendar-week>

    <ion-calendar-month
      [(ngModel)]="_calendarMonthValue"
      [month]="monthOpt"
      (onChange)="onChanged($event)"
      [pickMode]="_d.pickMode"
      [color]="_d.color">

    </ion-calendar-month>

  `,

})
export class CalendarComponent implements ControlValueAccessor, OnInit {


  monthOpt: CalendarMonth;
  @Input() options: CalendarComponentOptions;
  @Input() format: string = 'YYYY-MM-DD';
  @Input() type: 'string' | 'js-date' | 'moment' | 'time' | 'unix' | 'object' = 'string';
  @Output() onChange: EventEmitter<any> = new EventEmitter();

  _d: CalendarModalOptions;
  _calendarMonthValue: any[] = [null, null];
  _onChanged: Function = () => {
  };
  _onTouched: Function = () => {
  };

  constructor(public calSvc: CalendarService) {
  }

  ionViewDidLoad() {

  }

  ngOnInit() {
    this._d = this.calSvc.safeOpt(this.options || {});
    this.monthOpt = this.createMonth(new Date().getTime());
  }

  writeValue(obj: any): void {
    if (obj) {
      this._writeValue(obj);
      if (this._calendarMonthValue[0] && this._calendarMonthValue[0].time) {
        this.monthOpt = this.createMonth(this._calendarMonthValue[0].time);
      } else {
        this.monthOpt = this.createMonth(new Date().getTime());
      }
    }
  }

  registerOnChange(fn: any): void {
    this._onChanged = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  createMonth(date: number) {
    return this.calSvc.createMonthsByPeriod(date, 1, this._d)[0];
  }

  nextMonth() {
    const nextTime = moment(this.monthOpt.original.time).add(1, 'months').valueOf();
    this.monthOpt = this.createMonth(nextTime);
  }

  canNext() {
    if (!this._d.to) return true;
    return this.monthOpt.original.time < moment(this._d.to).valueOf();
  }

  backMonth() {
    const backTime = moment(this.monthOpt.original.time).subtract(1, 'months').valueOf();
    this.monthOpt = this.createMonth(backTime);
  }

  canBack() {
    if (!this._d.from) return true;
    return this.monthOpt.original.time > moment(this._d.from).valueOf();
  }

  onChanged($event: any[]) {
    switch (this._d.pickMode) {
      case 'single':
        const date = this._handleType($event[0].time);
        this._onChanged(date);
        this.onChange.emit(date);
        break;

      case 'range':
        if ($event[0] && $event[1]) {
          const rangeDate = {
            from: this._handleType($event[0].time),
            to: this._handleType($event[1].time)
          };
          this._onChanged(rangeDate);
          this.onChange.emit(rangeDate);
        }
        break;

      case 'multi':
        let dates = [];

        for (let i = 0; i < $event.length; i++) {
          if ($event[i] && $event[i].time) {
            dates.push(this._handleType($event[i].time));
          }
        }

        this._onChanged(dates);
        this.onChange.emit(dates);
        break;

      default:

    }
  }

  _writeValue(value: any) {
    if (!value) return;
    switch (this._d.pickMode) {
      case 'single':
        this._calendarMonthValue[0] = this._toTimestamp(value);
        break;

      case 'range':
        if (value.from) {
          this._calendarMonthValue[0] = this._toTimestamp(value.from);
        }
        if (value.to) {
          this._calendarMonthValue[1] = this._toTimestamp(value.to);
        }
        break;

      case 'multi':
        if (Array.isArray(value)) {
          this._calendarMonthValue = value.map(e => {
            return this.calSvc.createCalendarDay(this._toTimestamp(e), this._d);
          });
        } else {
          this._calendarMonthValue = [];
        }
        break;

      default:

    }
  }

  _toTimestamp(value: any) {
    let date;
    if (this.type === 'string') {
      date = moment(value, this.format);
    } else {
      date = moment(value);
    }
    return date.valueOf();
  }

  _handleType(value: any) {
    let date = moment(value);
    switch (this.type) {
      case 'string':
        return date.format(this.format);
      case 'js-date':
        return date.toDate();
      case 'moment':
        return date;
      case 'time':
        return date.valueOf();
      case 'unix':
        return date.unix();
      case 'object':
        return date.toObject();
    }
    return date;
  }

}
