import { Component } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from "rxjs/internal/Observable";

@Component({
	selector: 'app-root',
	template: `
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

	`
})

export class AppComponent {
	private bookCounter = 0;
	private itemsCollection: AngularFirestoreCollection;
	items: Observable<any[]>;
	book_names = [];

	constructor(
		private afs: AngularFirestore
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
	}

	addItem() {
		let item = {
			name: 'Book ' + this.bookCounter++,
			created_at: new Date()
		};
		this.itemsCollection.add(item);
	}

	filterBooks(name: string | null) {
		if(name) {
			this.itemsCollection = this.afs.collection('items', ref => ref.where('name', '==', name));
		} else {
			this.itemsCollection = this.afs.collection('items');
		}
		this.itemsCollection.ref.orderBy('created_at', 'desc');
		this.items = this.itemsCollection.valueChanges();

	}
}
