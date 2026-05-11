from marshmallow import Schema, fields, validate, validates, ValidationError


VALID_DOMAINS = ("@student.chula.ac.th", "@chula.ac.th")


class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))

    @validates("email")
    def validate_email_domain(self, value):
        if not any(value.lower().endswith(d) for d in VALID_DOMAINS):
            raise ValidationError("Email must use a @student.chula.ac.th or @chula.ac.th domain.")


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class ListingCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=3, max=200))
    description = fields.Str(load_default=None)
    price = fields.Float(required=True, validate=validate.Range(min=0.01))
    category = fields.Str(required=True, validate=validate.OneOf(["books", "electronics", "furniture", "other"]))
    item_condition = fields.Str(required=True, validate=validate.OneOf(["new", "like_new", "used"]))


class ListingUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=3, max=200))
    description = fields.Str()
    price = fields.Float(validate=validate.Range(min=0.01))
    category = fields.Str(validate=validate.OneOf(["books", "electronics", "furniture", "other"]))
    item_condition = fields.Str(validate=validate.OneOf(["new", "like_new", "used"]))
    remove_image_ids = fields.List(fields.Int(), load_default=[])


class MessageCreateSchema(Schema):
    listing_id = fields.Int(required=True)
    receiver_id = fields.Int(required=True)
    content = fields.Str(required=True, validate=validate.Length(min=1))


class RatingCreateSchema(Schema):
    listing_id = fields.Int(required=True)
    score = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    review_text = fields.Str(load_default=None)


class UserUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=100))
