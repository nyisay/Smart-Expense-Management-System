# Smart Expense Management

Personal bookkeeping and owner-managed shared-expense tracking.

## Language

**Monthly category budget**:
A personal expense-category spending limit for one calendar month. Months are independent; an unset limit is unbudgeted and unused allowance does not roll forward.
_Avoid_: Account balance, recurring payment

**Cash-flow savings rate**:
Recorded personal income minus recorded personal expenses, divided by that income for the selected period and category scope. It is undefined when selected income is zero and does not measure bank savings.
_Avoid_: Bank savings rate

**Transaction**:
A personal income or expense entry belonging to one user. Group expenses and repayments are separate records.
_Avoid_: Bank transaction

**Receipt**:
Metadata associated with evidence for a personal expense. A receipt suggestion becomes an expense only after the user confirms it.
_Avoid_: Saved expense

**Group member**:
A named participant in an owner's expense group. Membership does not give the participant an application account or access to the group.
_Avoid_: Invited user

**Group expense**:
A shared expense paid by one group member and allocated among participants.
_Avoid_: Bill, group transaction

**Expense share**:
The exact amount of a group expense owed by one participant.
_Avoid_: Payment

**Settlement**:
A record of a repayment made outside the application from one group member to another. Recording it does not transfer money.
_Avoid_: Payment execution

**Net member balance**:
The amount a member is owed after their paid expenses, owed shares and recorded repayments are accounted for. A positive balance means the member is owed money; a negative balance means the member owes money.
_Avoid_: Bank balance
