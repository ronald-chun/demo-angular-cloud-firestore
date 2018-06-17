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
		<!--<button (click)="filterBooks()">Filter books</button>-->

	`
})

export class AppComponent {
	private bookCounter = 0;
	private itemsCollection: AngularFirestoreCollection;
	items: Observable<any[]>;

	constructor(
		private afs: AngularFirestore
	) {
		this.itemsCollection = afs.collection('items', ref => ref.orderBy('created_at', 'desc'));
		this.items = this.itemsCollection.valueChanges();
	}

	addItem() {
		let item = {
			name: 'Book ' + this.bookCounter++,
			created_at: new Date()
		};
		this.itemsCollection.add(item);
	}
}
