import { ApplicationRef, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = "dark-theme" | "light-theme";

@Injectable({
  providedIn: 'root'
})
export class ThemingService {
  primaryColor: string = "#00a742";
  secondaryColor: string = "#7e72ff";
  colors: string[] = [this.primaryColor, '#00ff18', this.secondaryColor, '#f8e044', '#ff3978', '#ffa8dc', '#ff461a', '#006de6', '#2fd9d1', '#9ee800'];
  themes = ["dark-theme", "light-theme"]; // <- list all themes in this array
  theme: BehaviorSubject<Theme> = new BehaviorSubject<Theme>("light-theme"); // <- initial theme
  highchartsOptions: Highcharts.Options = {
    credits: {
      enabled: false
    },
  }

  constructor(private ref: ApplicationRef) {
    // Initially check if dark mode is enabled on system
    const darkModeOn =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // If dark mode is enabled then directly switch to the dark-theme
    if(darkModeOn){
      this.theme.next("dark-theme");
    }

    // Watch for changes of the preference
    window.matchMedia("(prefers-color-scheme: dark)").addListener(e => {
      const turnOn = e.matches;
      this.theme.next(turnOn ? "dark-theme" : "light-theme");

      // Trigger refresh of UI
      this.ref.tick();
    });
  }

  getPrimaryColor(): string {
    return this.primaryColor;
  }

  getSecondaryColor(): string {
    return this.secondaryColor;
  }

  getColors(): string[] {
    return this.colors;
  }

  setTheme(theme: Theme) {
    this.theme.next(theme);
  }

  getTheme(): Observable<Theme> {
    return this.theme.asObservable();
  }

  getHighchartsOptions(): Highcharts.Options {
    return this.highchartsOptions;
  }
}
