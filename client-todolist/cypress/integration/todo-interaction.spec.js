
describe('Todo Interaction Tests', () => {
  it('can add a todo item with enter or the "add todo" button', () => {
    cy.task('db:clearTodos');
    cy.visit('localhost:3000');

    cy.get('input.add-todo').type('Go feed the cat{enter}');
    cy.get('input.add-todo').type('Take out the trash');

    cy.get('button.add-todo').click();

    cy.get('.todolist > .todoitem').should((items) => {
      expect(items).to.have.length(2);
      expect(items.eq(0)).to.contain('Go feed the cat')
      expect(items.eq(1)).to.contain('Take out the trash')
    });

    cy.get('h4').eq(1).should('have.html', 'Your Todos (2)');
  });

  it('can mark items as completed or uncompleted', () => {
    cy.get('.todoitem').first().click();
    cy.get('.todoitem input[type="checkbox"]').first().should('have.prop', 'checked');

    cy.get('.todoitem').eq(1).click().click();
    cy.get('.todoitem input[type="checkbox"]').eq(1).should((item) => {
      expect(item).to.have.prop('checked', false);
    });
  });

  it('can delete completed items', () => {
    cy.task('db:completeAllTodos');

    cy.get('#delete-todos').should((button) => {
      expect(button).to.have.prop('disabled', false);
    });

    cy.get('#delete-todos').click();

    cy.get('.todolist > .todoitem').should('have.length', 0);
    cy.get('#delete-todos').should((button) => {
      expect(button).to.have.prop('disabled', true);
      expect(button).to.contain.html(0);
    });
  });
});
