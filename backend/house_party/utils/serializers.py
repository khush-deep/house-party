from django.core.serializers import serialize

def custom_serializer(query_list, fields=None):
    list = serialize('python', query_list, fields=fields)
    for i in range(len(list)):
        id = list[i]["pk"]
        list[i] = list[i].get("fields")
        list[i]["id"] = id
    return list