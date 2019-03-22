/// <reference types="dwt" />
import { Component, OnInit } from "@angular/core"
import dwtConfig from "./dwt/config"

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {

  baseAddress = "asp.demosoft.me"
  bPostLoad = false
  DWObject: WebTwain
  index = 0
  newIndices: any[] = []
  port = 80
  visible = false

  download() {
    this.DWObject.RemoveAllImages()

    this.DWObject.HTTPPort = this.port
    // this.DWObject.IfSSL = true
    this.DWObject.SetHTTPHeader("Authorization", "Bearer xxx")
    this.DWObject.HTTPDownload(this.baseAddress, "/api/files/fileName/imageData.pdf", () => { }, (code, message) => {
      console.log(`${code} - ${message}`)
    })
  }

  Dynamsoft_OnReady(): void {
    this.DWObject = Dynamsoft.WebTwainEnv.GetWebTwain("dwtcontrolContainer")
    if (this.DWObject) {
      this.DWObject.Height = 600
      this.DWObject.RegisterEvent("OnBitmapChanged", (strUpdatedIndex, operationType, sCurrentIndex) => {
        for (var i = 0; i < this.newIndices.length; i++) {
          this.newIndices[i] += 1
        }
        this.newIndices.push(parseInt(strUpdatedIndex[0]))
      })
      this.DWObject.ShowImageEditor("dwtcontrolContainerLargeViewer", 780, 600)
      this.DWObject.ShowPageNumber = true
      this.DWObject.SetViewMode(1, 4)
      this.DWObject.Width = 200
      if (this.DWObject.Addon && this.DWObject.Addon.PDF) {
        this.DWObject.Addon.PDF.SetResolution(300)
        this.DWObject.Addon.PDF.SetConvertMode(EnumDWT_ConvertMode.CM_RENDERALL)
      }
    }
  }

  initScan() {
    Dynamsoft.WebTwainEnv.Load()
    dwtConfig.applyConfig(Dynamsoft)
    Dynamsoft.WebTwainEnv.RegisterEvent("OnWebTwainReady", () => { this.Dynamsoft_OnReady() })
  }

  insert() {
    this.bPostLoad = false
    this.newIndices = []
    this.DWObject.IfAppendImage = false
    this.DWObject.CurrentImageIndexInBuffer = this.index
    this.DWObject.RegisterEvent("OnPostLoad", () => {
      if (!this.DWObject.IfAppendImage) {
        this.bPostLoad = true
        for (var j = 0; j < this.newIndices.length / 2; j++)
          if (this.newIndices[j] != this.newIndices[this.newIndices.length - j - 1])
            this.DWObject.SwitchImage(this.newIndices[j], this.newIndices[this.newIndices.length - j - 1])
      }
      this.DWObject.IfAppendImage = true
      this.newIndices = []
    })
    this.DWObject.RegisterEvent("OnBitmapChanged", (strUpdatedIndex, operationType, sCurrentIndex) => {
      if (operationType == 2) { //inserting
        for (var i = 0; i < this.newIndices.length; i++)
          this.newIndices[i] += 1
        this.newIndices.push(parseInt(strUpdatedIndex[0]))
      }
    })
    this.DWObject.LoadImageEx("", 5)
  }

  ngOnInit() {
    this.initScan()
  }

  print() {
    this.DWObject.Print(false)
  }

  initScanClick() {
    this.visible = false
    setTimeout(() => {
      this.visible = true
    }, 500)
    setTimeout(() => {
      this.initScan()
    }, 500)
  }

  upload() {
    this.DWObject.ClearAllHTTPFormField()
    this.DWObject.HttpFieldNameOfUploadedImage = "RemoteFile"
    this.DWObject.HTTPPort = this.port
    // this.DWObject.IfSSL = true
    this.DWObject.SetHTTPFormField("json", JSON.stringify({}))
    this.DWObject.SetHTTPHeader("Authorization", "Bearer xxx")
    this.DWObject.HTTPUploadAllThroughPostAsPDF(
      this.baseAddress,
      "/api/files",
      "imageData.pdf",
      () => {
        this.initScanClick()
      },
      (code, message, response) => {
        console.log(`${code} - ${message} - ${response}`)
        this.initScanClick()
      }
    );
  }
}