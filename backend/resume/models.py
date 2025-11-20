from django.db import models
import uuid

class Contract(models.Model):
    """
    Represents a contract document stored in the system.

    This model stores the metadata associated with a contract, which is 
    linked to both the raw file in an S3 bucket and its vector representation 
    in the Qdrant database.
    """
    # Use a UUID for the primary key for robustness
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # This links the Django record to the specific point in Qdrant
    qdrant_id = models.UUIDField(
        unique=True, 
        help_text="The corresponding ID of the contract in the Qdrant vector database."
    )
    
    # The vendor or party associated with the contract
    vendor_name = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    
    # Direct link to the PDF/DOCX file in S3
    s3_url = models.URLField(max_length=1024, verbose_name="S3 URL")
    
    # Key dates extracted from the contract
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    renewal_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    
    # Financial data
    budget = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text="The total budget amount for the contract."
    )
    percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text="Any relevant percentage, like a commission or fee."
    )
    
    # Timestamps for tracking
    uploaded_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self):
        """
        String representation of the Contract model.
        """
        return f"Contract for {self.vendor_name or 'Unknown Vendor'} ({self.id})"

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Contract"
        verbose_name_plural = "Contracts"
