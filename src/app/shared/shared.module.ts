import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ServerService} from "./service/server.service";
import {HttpClientModule} from "@angular/common/http";



@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    CommonModule
  ],
  providers: [ServerService]
})
export class SharedModule { }
