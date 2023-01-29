#include <stdio.h>
#include <stdlib.h>
#include <string.h>
//structure declarations
struct book
{
    char *title;
    char *author;
    char *subject;
};
typedef struct book book;//clone of structure book, hence convenience provided
book collection;//declaring collection type book that points to the structure book, hence convenience provided
struct library
{
    struct book collection;
    int num_books;
    struct library *nextptr;
};

typedef struct library lib;//clone of structure library
typedef lib *libptr; //declare pointer type lib to create pointer nodes, hence convenience provided

//function declarations
void addbook(libptr *headptr , char *title, char *author, char *subject);
void printbooks(libptr headptr);
void copybook(libptr, libptr);
void deleteabook(libptr *headptr, char *deletetitle);
void deletebooks(libptr *headptr, char *deleteauthor);
void searchbytitle(libptr *headptr, char *searchtitle);
void searchbyauthor(libptr *headptr, char *searchauthor);
void listbyauthor(libptr *headptr, char *searchauthor);
void listbysubject(libptr *headptr, char *searchsubject);
void listing(libptr *headptr, char *title, char *author, char *subject);
int main(void)
{
    //declarations of array,updates,choices,counters
    char title[50];
    char author[50];
    char subject[50];
    int updates;
    int choice;
    int counter = 0;
    libptr headptr = NULL;
    FILE *fp = NULL;
    //to read library.txt file
    FILE *ftread = fopen("library.txt", "r");
    fscanf(ftread, "%i", &updates);
    while (!feof(ftread))
    {
        fscanf(ftread, "%i\n", &choice);
        if (choice == 1)
        //to count the choices and add into counter
        {
                fseek(ftread, -3, SEEK_CUR);//move back 3 position from current position
                fscanf(ftread, "%i %s %s %s\n", &choice, title, author, subject);
                counter++;
        }
                else
                {
                    fseek(ftread, -3, SEEK_CUR);
                    fscanf(ftread, "%i %s\n", &choice, title);
                    counter++;
                }

    }
    fseek(ftread, 3, SEEK_SET); //to reset the blinking cursor
    //to counter check whether amount of choices added in counter == updates stated in library.txt
    while (!feof(ftread))
    {
        if (counter != updates)
        {
            break;
        }
        fscanf(ftread, "%i\n", &choice);
        //perform instructions independently on each choices
        switch (choice)
        {
            //add book
            case 1:
                fseek(ftread, -3, SEEK_CUR);//move back 3 position from current position to able to scan the whole thing
                fscanf(ftread, "%i %s %s %s\n", &choice, title, author, subject);
                addbook(&headptr, title, author, subject);
                break;
            //delete a book by title
            case 2:
                fseek(ftread, -3, SEEK_CUR);
                fscanf(ftread, "%i %s\n", &choice, title);
                deleteabook(&headptr, title);
                break;
            //delete books by author
            case 3:
                fseek(ftread, -3, SEEK_CUR);
                fscanf(ftread, "%i %s\n", &choice, author);
                deletebooks(&headptr, author);
                break;
            case 4:
                //search by title
                fseek(ftread, -3, SEEK_CUR);
                fscanf(ftread, "%i %s\n", &choice, title);
                searchbytitle(&headptr, title);
                break;
            case 5:
                //search by author
                fseek(ftread, -3, SEEK_CUR);
                fscanf(ftread, "%i %s\n", &choice, author);
                searchbytitle(&headptr, author);
                break;
            case 6:
                //list by author
                fseek(ftread, -3, SEEK_CUR);
                fscanf(ftread, "%i %s\n", &choice, author);
                listbyauthor(&headptr, author);
                break;
            case 7:
                //list by subject
                fseek(ftread, -3, SEEK_CUR);
                fscanf(ftread, "%i %s\n", &choice, subject);
                listbysubject(&headptr, subject);
                break;
            case 8:
                fseek(ftread, -3, SEEK_CUR);
                fscanf(ftread, "%i %s\n", &choice, title,author,subject);
                listing(&headptr,title,author,subject);
                break;
            default:
                //choices excluding the 8 instructions
                fp = fopen("output.txt", "a");
                fputs("Invalid Command.",fp);
                break;
        }

    }
}

void addbook(libptr *headptr, char *title, char *author, char *subject) //taken from Lecture Slides 10 from Programming and Algorithm provided by Mr Chew Sze Ker
{
    //declarations of node pointers
    libptr currentptr;
    libptr newptr;
    libptr previousptr;
    int temp;

    //allocate space
    newptr = malloc(sizeof(struct library));
    newptr->collection.title = malloc(50 * sizeof(char));
    newptr->collection.author = malloc(50 * sizeof(char));
    newptr->collection.subject = malloc(50 * sizeof(char));

    if (newptr != NULL)
    {
        memcpy(newptr->collection.title, title,49);
        memcpy(newptr->collection.author, author,49);
        memcpy(newptr->collection.subject, subject,49);
        newptr->nextptr = NULL;
        previousptr = NULL;
        currentptr = *headptr;


        while (currentptr != NULL)
        {
           previousptr = currentptr;
           currentptr = currentptr->nextptr;
        }

        if (previousptr == NULL)
        {
            newptr->nextptr = *headptr;
            *headptr = newptr;
            FILE *fptr = fopen("output.txt", "w");
            fprintf(fptr, "The book %s author %s subject %s has been added to the library\n", title, author, subject);
        }
        else
        {
            previousptr->nextptr = newptr;
            newptr->nextptr = currentptr;
            FILE *fptr = fopen("output.txt", "a");
            fprintf(fptr, "The book %s author %s subject %s has been added to the library\n", title, author, subject);
        }
        temp++;
    }
    if(temp>=30)
    {
        FILE *fptr = fopen("output.txt","a");
        fprintf(fptr,"Maximum books had been stored.\n");
    }
}

void deleteabook(libptr *headptr, char *deletetitle)
{
    //declaration of node pointers
    libptr secondlastptr;
    libptr tempptr;
    libptr previousptr;
    libptr deleteptr;
    libptr currentptr;

    currentptr = *headptr;
    deleteptr = *headptr;
    secondlastptr = *headptr;
    previousptr = *headptr;
    //compare whether title wanted to be deleted == the title stored in the node pointed by deleteptr
    while (strcmp(deleteptr->collection.title, deletetitle) != 0)
    {
        deleteptr = deleteptr->nextptr;
    }
    //to find the location of the second last pointer
    while (secondlastptr->nextptr->nextptr != NULL)
    {
        previousptr = secondlastptr;
        secondlastptr = secondlastptr->nextptr;
    }
    copybook(deleteptr, secondlastptr); //copying second last data into vacated node

    while (1)
    {
        //deletion method taken from Lecture Slides 10 from Programming and Algorithm provided by Mr Chew Sze Ker
        if (strcmp(currentptr->collection.title, deletetitle) == 0)
        {
            tempptr = currentptr;
            currentptr = currentptr->nextptr;
            free(tempptr);
            break;
        }
        else //deletion and linking to position in front of deleted node
        {
            tempptr = secondlastptr;
            previousptr->nextptr = secondlastptr->nextptr;
            free(secondlastptr);
            FILE *fp = fopen("output.txt", "a");
            fprintf(fp, "The book %s has been deleted from the library\n", deletetitle);
            break;
        }
    }
}

void copybook(libptr deleteptr, libptr previousptr)
{
    strcpy(deleteptr->collection.title, previousptr->collection.title);
    strcpy(deleteptr->collection.author, previousptr->collection.author);
    strcpy(deleteptr->collection.subject, previousptr->collection.subject);
}

void deletebooks(libptr *headptr, char *deleteauthor)
{

    libptr currentptr;
    libptr previousptr;
    libptr tempptr;
	int temp;
    currentptr = *headptr;

    while (currentptr->nextptr != NULL)
    {
        //deletion method taken from Lecture Slides 10 Programming and Algorithm provided by Mr Chew Sze Ker
        if (strcmp((*headptr)->collection.author, deleteauthor) == 0)
        {
            tempptr = *headptr;
            *headptr = (*headptr)->nextptr;
            free(tempptr);
            currentptr = *headptr;
			temp++;
        }
        else
        {
            //point to next node to check whether author to be deleted == with the author inside the node
            previousptr = currentptr;
            currentptr = currentptr->nextptr;
            if (strcmp(currentptr->collection.author, deleteauthor) == 0)
            {
                //linking to node in front of the deleted node
                tempptr = currentptr;
                previousptr->nextptr = currentptr->nextptr;
                free(tempptr);
                FILE *fp = fopen("output.txt", "a");
                fprintf(fp, "The books by %s have been deleted\n",deleteauthor);
				temp++;
            }
		}
	}
			if (temp == 0)
            {
                FILE *fp = fopen("output.txt", "a");
                fprintf(fp, "Deletion cannot be performed as requested item does not exist\n.");
            }
        
    
}

void searchbytitle(libptr *headptr, char *searchtitle)
{
    libptr currentptr;
    currentptr = *headptr;
    while (currentptr->nextptr != NULL) //to continuously point to next node and search
    {
        if (strcmp(currentptr->collection.title, searchtitle) == 0)//comparison between title to be searched and the title inside current pointer pointed node
        {
            FILE *fp = fopen("output.txt", "a");
            fprintf(fp, "The book %s is currently in the library\n", searchtitle);
        }
        else
        {
            FILE *fp = fopen("output.txt", "a");
            fprintf(fp, "The book %s is not currently in the library\n", searchtitle);
        }
        currentptr = currentptr->nextptr;
    }

}

void searchbyauthor(libptr *headptr, char *searchauthor)
{
    libptr currentptr;
    currentptr = *headptr;
    int temp;
    while(currentptr->nextptr != NULL)//to continuously point to next node and search
    {
        if(strcmp(currentptr->collection.author, searchauthor) == 0)//comparison between author to be searched and the title inside current pointer pointed node
        {
            FILE *fp = fopen("output.txt","a");
            fprintf(fp,"The books by %s are currently in the library which is\n",searchauthor,currentptr->collection.title);
            temp++;
        }
        currentptr = currentptr->nextptr;
    }
           if(temp == 0)
            {
            FILE *fp = fopen("output.txt","a");
            fprintf(fp,"The books by %s are currently not in the library\n",searchauthor);
            }
}

void listbyauthor(libptr *headptr, char *searchauthor)
{
    libptr currentptr;
    int temp;
    currentptr = *headptr;
    FILE *fp = fopen("output.txt","a");
    fprintf(fp,"List of all books by %s :\n",searchauthor);
    while(currentptr->nextptr != NULL)
    {
        if(strcmp(strlwr(currentptr->collection.author), strlwr(searchauthor)) == 0)//comparing both lowercased author input and lowercased author from the node
        {
            FILE *fp = fopen("output.txt","a");
            fprintf(fp,"%s\n",currentptr->collection.title);
            temp++;//if book been found +1
        }
        currentptr  = currentptr->nextptr;
    }
                if(temp == 0)//if no books by the author been found at all
            {
                FILE *fp = fopen("output.txt","a");
                fprintf(fp,"No book from author %s.\n",searchauthor);
            }
}

void listbysubject(libptr *headptr, char *searchsubject)
{
    libptr currentptr;
    int temp;
    currentptr = *headptr;
    FILE *fp = fopen("output.txt","a");
    fprintf(fp,"List of all books on %s :\n",searchsubject);
    while(currentptr->nextptr!=NULL)
    {
        if(strcmp(strlwr(currentptr->collection.subject), strlwr(searchsubject)) == 0)//comparing both lowercased subject input and lowercased subject from the node
        {
            FILE *fp = fopen("output.txt","a");
            fprintf(fp,"%s\n",currentptr->collection.title);
            temp++;//if book been found +1
        }
        currentptr = currentptr->nextptr;
    }
            if(temp==0)//if no books by the subject been found at all
            {
                FILE *fp = fopen("output.txt","a");
                fprintf(fp,"No related book for %s is found.\n",searchsubject);
            }
}

void listing(libptr *headptr, char *title, char *author, char *subject)
{
    libptr currentptr;
    currentptr = *headptr;
    if(currentptr == NULL)//no books inside the list
    {
        FILE *fp = fopen("output.txt","a");
        fprintf(fp,"The List is empty\n");
    }
    else
    {
        FILE *fp = fopen("output.txt","a");
        fprintf(fp,"The List is :\n");
        while(currentptr != NULL)//continuously search for next node
        {
            FILE *fp = fopen("output.txt","a");
            fprintf(fp,"%s %s %s ->",currentptr->collection.title, currentptr->collection.author, currentptr->collection.subject);
            currentptr=currentptr->nextptr;
        }
    }
}


