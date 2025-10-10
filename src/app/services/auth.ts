import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';

export interface Staff {
  staff_id: string;
  full_name: string;   // must match backend response
  department: string;
}

interface LoginResponse {
  success: boolean;
  staff?: Staff;
  message?: string;
  lockout?: boolean;
  remainingTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // API endpoint relative to current domain
 private apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/login.php';

  public loggedIn = signal<boolean>(!!localStorage.getItem('staff'));

  constructor(private http: HttpClient) {}

  login(staffId: string, department: string, password: string): Observable<LoginResponse> {
    // Trim inputs to avoid invisible characters
    const payload = {
      staff_id: staffId.trim(),
      department: department.trim(),
      password: password.trim()
    };

    console.log('DEBUG: Payload being sent to backend:', payload);

    return this.http.post<LoginResponse>(this.apiUrl, payload, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      tap(response => {
        console.log('DEBUG: Response from backend:', response);
        if (response.success && response.staff) {
          localStorage.setItem('staff', JSON.stringify(response.staff));
          this.loggedIn.set(true);
          localStorage.setItem('department', response.staff.department);
        }
      }),
      catchError(err => {
        console.error('Login error:', err);
        if (err.status === 429) {
          // Lockout, return the response
          return of(err.error);
        }
        return throwError(() => new Error('Login failed. Please try again.'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('staff');
    this.loggedIn.set(false);
  }

  getStaff(): Staff | null {
    const staff = localStorage.getItem('staff');
    return staff ? JSON.parse(staff) : null;
  }
}
