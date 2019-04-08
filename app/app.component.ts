import { Component } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { switchMap } from 'rxjs/operators/switchMap';
import { map } from 'rxjs/operators/map';
import { windowCount } from 'rxjs/operators/windowCount';
import { scan } from 'rxjs/operators/scan';
import { take } from 'rxjs/operators/take';
import { tap } from 'rxjs/operators/tap';
import { from } from 'rxjs/observable/from';
import { merge } from 'rxjs/observable/merge';

import { Message, User, SendMessageEvent } from '@progress/kendo-angular-conversational-ui';

import { Agent } from './agent';

@Component({
  selector: 'my-app',
  template: `
    <kendo-chat
      [messages]="feed | async"
      [user]="user"
      (sendMessage)="sendMessage($event)"
    >
      <ng-template kendoChatAttachmentTemplate let-att>
        <ng-container [ngSwitch]="att.type">

          <quote-card *ngSwitchCase="'quote'"
            [quote]="att">
          </quote-card>

          <payment-plan-card *ngSwitchCase="'payment_plan'"
            [plan]="att">
          </payment-plan-card>

          <kendo-chat-hero-card *ngSwitchDefault
            imageUrl="{{ att.images[0]?.url }}"
            [title]="att.title"
            [subtitle]="att.subtitle"
            [actions]="att.buttons"
            (executeAction)="heroAction($event)"
          >
          </kendo-chat-hero-card>

        </ng-container>
      </ng-template>
    </kendo-chat>
  `
})
export class AppComponent {
  public feed: Observable<Message[]>;

  public readonly user: User = {
    id: 1
  };

  public readonly bot: User = {
    id: 0,
    name: 'Bobby McBot',
    avatarUrl: 'https://demos.telerik.com/kendo-ui/content/chat/avatar.png'
  };

  private agent: Agent = new Agent(this.bot);
  private local: Subject<Message> = new Subject<Message>();

  constructor() {
    // Merge local and remote messages into a single stream
    this.feed = merge(
      this.local,
      this.agent.responses
    ).pipe(
      // ... and emit an array of all messages
      scan((acc, x) => [...acc, x], [])
    );
  }

  public sendMessage(e: SendMessageEvent): void {
    this.send(e.message);
  }

  public heroAction(button: any) {
    if (button.type === 'postBack') {
      const message = {
        author: this.user,
        text: button.value
      };

      this.send(message);
    }
  }

  private send(message: Message) {
    this.local.next(message);
    this.local.next({
      author: this.bot,
      typing: true
    });
    this.agent.submit(message.text);
  }
}
