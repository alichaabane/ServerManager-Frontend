import {Component, OnInit} from '@angular/core';
import {ServerService} from "./shared/service/server.service";
import {BehaviorSubject, map, Observable, of, startWith} from "rxjs";
import {AppState} from "./shared/model/app-state";
import {CustomResponse} from "./shared/model/custom-response";
import {DataState} from "./shared/enum/data-state.enum";
import {catchError} from "rxjs/operators";
import {Status} from "./shared/enum/status.enum";
import {NgForm} from "@angular/forms";
import {Server} from "./shared/model/server";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  constructor(private serverService: ServerService) {
  }

  ngOnInit(): void {
    // reactive approach
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.dataSubject.next(response); // we saved the response
          return {
            dataState: DataState.LOADED_STATE,
            // last added server on the top of the list
            appData: {...response, data: {servers: response.data.servers.reverse()}}
          }
        }),
        startWith({dataState: DataState.LOADING_STATE, appData: null}),
        catchError((error: string) => {
          return of({dataState: DataState.ERROR_STATE, error});
        })
      );
  }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(res => {
          const index = this.dataSubject.value.data.servers.findIndex(server => server.id === res.data.server.id) // take index of pinged server

          this.dataSubject.value.data.servers[index] = res.data.server; // update our data subject

          this.filterSubject.next(''); // to stop the spinner

          return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
        }),
        //  starting to loop the data stored in this subject and updates the information  in the response (if there's changes
        // from the backend)
        startWith({dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}),
        catchError((error: string) => {
          this.filterSubject.next(''); // to stop the spinner
          return of({dataState: DataState.ERROR_STATE, error});
        })
      )
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value as Server)
      .pipe(
        map(res => {
          this.dataSubject.next(
            {
              // new server concatenated with old servers
              ...res, data: {servers: [res.data.server, ...this.dataSubject.value.data.servers]}
            }
          );
          document.getElementById('closeModal').click();
          this.isLoading.next(false);
          serverForm.resetForm({status: this.Status.SERVER_DOWN}); // reset form and put for form status by default server down
          return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
        }),
        //  starting to loop the data stored in this subject and updates the information  in the response (if there's changes
        // from the backend)
        startWith({dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({dataState: DataState.ERROR_STATE, error});
        })
      )
  }

  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id)
      .pipe(
        map(res => {
          this.dataSubject.next(
            {
              ...res,
              data: {
                servers: this.dataSubject.value.data.servers.filter(s => s.id !== server.id)
              }
            }
          )
          return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
        }),
        //  starting to loop the data stored in this subject and updates the information  in the response (if there's changes
        // from the backend)
        startWith({dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}),
        catchError((error: string) => {
          return of({dataState: DataState.ERROR_STATE, error});
        })
      )
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(res => {
          return {dataState: DataState.LOADED_STATE, appData: res}
        }),
        //  starting to loop the data stored in this subject and updates the information  in the response (if there's changes
        // from the backend)
        startWith({dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}),
        catchError((error: string) => {
          return of({dataState: DataState.ERROR_STATE, error});
        })
      )
  }

  printReport() {
      this.serverService.exportToExcel().subscribe(res => {
        // console.log(res.headers);
        const contentDisposition = res.headers.get('content-disposition');
        const fileName = contentDisposition.replace('attachment; filename=', '');
        const blob = res.body;
        const url = window.URL.createObjectURL(blob);
        const element = document.createElement('a');
        element.download = fileName;
        element.href = url;
        element.click();
      })
  }
}
