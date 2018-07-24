import { Component } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from "rxjs/internal/Observable";
import { AngularFireAuth } from "angularfire2/auth";
import * as firebase from "firebase";
import * as $ from 'jquery';
import { forEach } from "@angular/router/src/utils/collection";
import { a } from "@angular/core/src/render3";

@Component({
	selector: 'app-root',
	template: `
		<div class="row">
			<div class="col-12 col-sm-6">
				<div *ngIf="afAuth.authState | async; let user; else showLogin">
					<h1>Hello {{ user.displayName ? user.displayName : user.email }}!</h1>

					<!-- Link to Email -->
					<div *ngIf="!providers.email; else unlinkToEmail">
						<button (click)="linkToEmail()">Link to Email</button>
						<input type="email" id="link-email-account" placeholder="Email">
						<input type="password" id="link-email-password" placeholder="Password">
					</div>
					<ng-template #unlinkToEmail>
						<div *ngIf="providers.total > 1">
							<button (click)="unlinkToEamil()">UnLink to Email</button>
						</div>
					</ng-template>

					 <!-- Link to Google-->
					<div *ngIf="!providers.google ;else unlinkToGoogle">
						<br>
						<br>
						<button (click)="linkToGoogle()">Link to Google</button>
					</div>
					<ng-template #unlinkToGoogle>
						<br>
						<br>
						<div *ngIf="providers.total > 1">
							<button (click)="unLinkToGoogle()">UnLink to Google</button>
						</div>
					</ng-template>

					<br>
					<br>
					<button (click)="verify()">Verify Email</button>
					<button (click)="resetPassword()">Reset Password</button>
					<input id='reset-password' type="password" placeholder="Reset Password"/>
					<button (click)="logout()">Logout</button>
				</div>
				<ng-template #showLogin>
					<p>Please login.</p>
					<button (click)="login('google')">Login with Google</button>
					<br>
					<br>
					<button (click)="signUp()">Signup with Email</button>
					<button (click)="login('email')">Login with Email</button>
					<br>
					<input type="email" id="email-account" placeholder="Email">
					<input type="password" id="email-password" placeholder="Password">
					<!--<button (click)="login('facebook')">Login with Facebook</button>-->
				</ng-template>
			</div>
			<div class="col-12 col-sm-6">
				<ul>
					<li *ngFor="let item of items | async">
						<pre>{{ item | json }}</pre>
					</li>
				</ul>
				<button (click)="addItem()">Add a book!</button>
				<select (change)="filterBooks($event.target.value)">
					<option value="">All</option>
					<option *ngFor="let book_name of book_names" [value]="book_name">{{book_name}}</option>
				</select>
			</div>
		</div>
	`
})

export class AppComponent {
	private bookCounter = 0;
	private itemsCollection: AngularFirestoreCollection;
	items: Observable<any[]>;
	book_names = [];
	providers = {
		total: 0,
		google: false,
		facebook: false,
		email: false,
	};

	constructor(
		private afs: AngularFirestore,
		public afAuth: AngularFireAuth,
	) {
		this.itemsCollection = afs.collection('items', ref => ref.orderBy('created_at', 'desc'));
		this.items = this.itemsCollection.valueChanges();
		this.items.subscribe(
			data => {
				data.forEach(value => {
					if(this.book_names.indexOf(value.name) == -1) {
						this.book_names.push(value.name);
					}
				});
			},
			err => {
				console.error(err);
			},
			() => {
				console.log('done')
			}
		)

		firebase.auth().onAuthStateChanged((user) => {
			if(user) {
				console.log("User is logined", user);
				user.providerData.forEach((provider) => {
					switch(provider.providerId) {
						case 'google.com':
							this.providers.google = true;
							break;
						case 'facebook.com':
							this.providers.facebook = true;
							break;
						case 'password':
							this.providers.email = true;
							break;
					}
					this.providers.total++;
				});
				console.log('init: ', this.providers);
			} else {
				console.log("User is not logined yet.");
			}
		});
	}

	/**
	 * Add book
	 */
	addItem() {
		let item = {
			name: 'Book ' + this.bookCounter++,
			created_at: new Date()
		};
		this.itemsCollection.add(item);
	}

	/**
	 * Filter the books
	 * @param {string | null} name
	 */
	filterBooks(name: string | null) {
		if(name) {
			this.itemsCollection = this.afs.collection('items', ref => ref.where('name', '==', name));
		} else {
			this.itemsCollection = this.afs.collection('items');
		}
		this.itemsCollection.ref.orderBy('created_at', 'desc');
		this.items = this.itemsCollection.valueChanges();
	}


	/**
	 * Sign up by email Function
	 */
	signUp() {
		let account = $('#email-account').val();
		let password = $('#email-password').val();
		firebase.auth().createUserWithEmailAndPassword(account, password).catch(function(error) {
			var errorCode = error.code;
			var errorMsg = error.message;
			switch(errorCode) {
				case 'auth/weak-password':
					console.log('The password is too weak.');
					break;
				case 'auth/invalid-email':
					console.log('The email is invalid.');
					break;
				case 'auth/email-already-in-use':
					console.log('The email is already in use.');
					break;
				case 'auth/operation-not-allowed':
					console.log('The operation is not allowed');
					break;

				default:
					console.log(errorMsg);
			}
			// console.log(error);
		});
	}


	/**
	 * Login Function
	 * @param provider
	 */
	login(provider) {
		switch(provider) {
			/**
			 * Google Register / Login
			 */
			case 'google':
				this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
				break;

			/**
			 * Email Login
			 */
			case 'email':
				// this.afAuth.auth.signInWithPopup(new firebase.auth.EmailAuthProvider());
				let account = $('#email-account').val();
				let password = $('#email-password').val();

				firebase.auth().signInWithEmailAndPassword(account, password).catch(function(error) {
					var errorCode = error.code;
					var errorMessage = error.message;
					switch(errorCode) {
						case 'auth/wrong-password':
							console.log('Wrong password.');
							break;
						case 'auth/invalid-email':
							console.log('The email is invalid.');
							break;
						default:
							console.log(errorMessage);
					}
					// console.log(error);
				});
				break;

			/**
			 * Facebook Register / Login
			 */
			case 'facebook':
				//TODO
				// this.afAuth.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());
				break;
			default:

		}
	}

	/**
	 * Verify email Function
	 */
	verify() {
		let user = firebase.auth().currentUser;
		console.log(user);
		user.sendEmailVerification().then(function() {
			console.log("驗證信寄出");
		}, function(error) {
			console.error("驗證信錯誤");
		});
	}

	/**
	 * Reset password Function
	 */
	resetPassword() {
		let user = firebase.auth().currentUser;
		firebase.auth().sendPasswordResetEmail(user.email)
			.then(function() {
				// Password reset email sent.
				console.log('Reset pasword email sent.');
			})
			.catch(function(error) {
				// Error occurred. Inspect error.code.
				console.log('Reset pasword error: ' + error);

			});

	}

	/**
	 * Logout Function
	 */
	logout() {
		this.afAuth.auth.signOut();
		this.providers = {
			total: 0,
			google: false,
			facebook: false,
			email: false,
		}
	}

	/**
	 * Link to email Function
	 */
	linkToEmail() {
		let account = $('#link-email-account').val();
		let password = $('#link-email-password').val();

		var credential = firebase.auth.EmailAuthProvider.credential(account, password);
		firebase.auth().currentUser.linkAndRetrieveDataWithCredential(credential).then((result) => {
			var user = result.user;
			this.providers.email = true;
			this.providers.total++;
			console.log("Email Account linking success", user);
			console.log(this.providers);
		}, function(error) {
			console.log("Eamil Account linking error", error);
		});
	}

	/**
	 * Link to Google Function
	 */
	linkToGoogle() {
		var provider = new firebase.auth.GoogleAuthProvider();
		firebase.auth().currentUser.linkWithPopup(provider).then((result) => {
			// Accounts successfully linked.
			var credential = result.credential;
			var user = result.user;
			this.providers.google = true;
			this.providers.total++;
			console.log("Google Account linking success", result);
			console.log(this.providers);
		}).catch(function(error) {
			// Handle Errors here.
			console.log("Google Account linking error", error);
		});
	}

	/**
	 * Unlink email Function
	 */
	unlinkToEamil() {
		firebase.auth().currentUser.unlink('password').then((result) => {
			// Auth provider unlinked from account
			this.providers.email = false;
			this.providers.total--;
			console.log('unlinkToEamil(): success ', result);
			console.log(this.providers);
		}).catch(function(error) {
			// An error happened
			console.log('unlinkToEamil(): error ' + error);
		});
	}

	/**
	 * Unlink Google Function
	 */
	unLinkToGoogle() {
		firebase.auth().currentUser.unlink('google.com').then((result) => {
			// Auth provider unlinked from account
			this.providers.google = false;
			this.providers.total--;
			console.log('unlinkToGoogle(): success ', result);
			console.log(this.providers);
		}).catch(function(error) {
			// An error happened
			console.log('unlinkToGoogle(): error ' + error);
		});
	}
}
