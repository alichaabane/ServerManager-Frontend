import {DataState} from "../enum/data-state.enum";

// the enitre application State at any given moment
export interface AppState<T> {
  dataState: DataState; // contains the state of the application
  appData?: T; // contains all data of the application
  error?: string;
}
