import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {CustomResponse} from "../model/custom-response";
import {environment} from "../../../environments/environment.prod";
import {Observable, throwError} from "rxjs";
import {catchError, tap} from "rxjs/operators";
import {Server} from "../model/server";
import {Status} from "../enum/status.enum";

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  private readonly apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) {
  }

  // typical procedural approach
  // getServers(): Observable<CustomResponse> {
  //   return this.http.get<CustomResponse>(`${this.apiUrl}/list`);
  // }

  // reactive approach
  servers$ = <Observable<CustomResponse>>this.http.get<CustomResponse>(`${this.apiUrl}/list`)
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  save$ = (server: Server) =>
    <Observable<CustomResponse>>this.http.post<CustomResponse>(`${this.apiUrl}/save`, server)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  ping$ = (ipAddress: string) =>
    <Observable<CustomResponse>>this.http.get<CustomResponse>(`${this.apiUrl}/ping/${ipAddress}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  filter$ = (status: Status, response: CustomResponse) =>
    <Observable<CustomResponse>>
      new Observable<CustomResponse>(
        subscriber => {
          console.log(response);
          subscriber.next(
            status === Status.ALL ? {...response, message: `Servers filtered by ${status} status`} :
              {
                ...response, message: response.data.servers.filter(server => server.status === status).length > 0 ?
                  `Servers filtered by ${status === Status.SERVER_UP ? 'Server Up' : 'Server Down'} status` :
                  `No servers of ${status} found`,
                data: {servers: response.data.servers.filter(server => server.status === status)}

              }
          );
          subscriber.complete();
        }
      )
        .pipe(
          tap(console.log),
          catchError(this.handleError)
        );

  delete$ = (serverId: number) =>
    <Observable<CustomResponse>>this.http.delete<CustomResponse>(`${this.apiUrl}/delete/${serverId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  exportToExcel() {
    return   this.http.post(`${this.apiUrl}/export-excel`, null,{responseType: 'blob', observe: 'response'});
  }

  handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(() => `An error occurred - Error Code : ${error.status}`);
  }
}








