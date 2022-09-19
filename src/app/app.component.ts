import {Component, OnInit} from '@angular/core';
import {ServerService} from "./shared/service/server.service";
import {map, Observable, of, startWith} from "rxjs";
import {AppState} from "./shared/model/app-state";
import {CustomResponse} from "./shared/model/custom-response";
import {DataState} from "./shared/enum/data-state.enum";
import {catchError} from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  appState$: Observable<AppState<CustomResponse>>;

  constructor(private serverService: ServerService) {
  }

  ngOnInit(): void {
    // reactive approach
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          return {
            dataState: DataState.LOADED_STATE,
            appData: response
          }
        }),
        startWith( {dataState: DataState.LOADING_STATE, appData: null}),
        catchError((error: string) => {
          return of({dataState: DataState.ERROR_STATE, error})
        })
      );
    console.log(this.appState$)
  }
}
